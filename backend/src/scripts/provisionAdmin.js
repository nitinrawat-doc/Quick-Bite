#!/usr/bin/env node
/**
 * QuickBite — Secure Administrator Provisioning Script
 *
 * Usage:
 *   1. Generate a single-use Admin Invitation Code for the registration form:
 *      node backend/src/scripts/provisionAdmin.js --invite
 *
 *   2. Directly provision an administrator account:
 *      node backend/src/scripts/provisionAdmin.js --name "Admin Name" --email "admin@quickbite.campus" --password "SecurePass123!"
 *
 *   3. Interactive / Default check:
 *      node backend/src/scripts/provisionAdmin.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const AdminInvite = require('../models/AdminInvite');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quickbite';

async function main() {
  console.log('----------------------------------------------------');
  console.log('  QuickBite — Secure Admin Provisioning Utility');
  console.log('----------------------------------------------------');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[+] Connected to MongoDB: ${MONGODB_URI}`);

    const args = process.argv.slice(2);
    const getArg = (flag) => {
      const idx = args.indexOf(flag);
      return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
    };

    const isInviteMode = args.includes('--invite') || args.includes('-i');
    const name = getArg('--name');
    const email = getArg('--email');
    const password = getArg('--password');
    const phone = getArg('--phone');

    if (isInviteMode || (!name && !email && !password)) {
      // Generate single-use invitation token
      const code = AdminInvite.generateCode();
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const invite = await AdminInvite.create({
        code,
        invitedEmail: email ? email.toLowerCase().trim() : null,
        expiresAt,
        note: 'Provisioned via server provisioning script',
      });

      console.log('\n[SUCCESS] Single-use Admin Invitation Code generated:');
      console.log('----------------------------------------------------');
      console.log(`  Invitation Code: ${invite.code}`);
      console.log(`  Expires At:      ${invite.expiresAt.toISOString()} (48 hours)`);
      if (invite.invitedEmail) {
        console.log(`  Restricted to:   ${invite.invitedEmail}`);
      }
      console.log('----------------------------------------------------');
      console.log('Instructions:');
      console.log('1. Go to http://localhost:5173/register');
      console.log('2. Select "Canteen Admin" account type.');
      console.log('3. Paste the invitation code above to complete setup.');
      console.log('4. The code will expire in 48h and cannot be reused.');
    } else {
      // Direct admin user creation
      if (!email || !password) {
        console.error('\n[ERROR] Both --email and --password are required for direct creation.');
        process.exit(1);
      }

      const adminEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ email: adminEmail });

      if (existingUser) {
        if (existingUser.role === 'admin') {
          console.log(`\n[!] User "${adminEmail}" already exists and has 'admin' role.`);
        } else {
          console.log(`\n[!] User "${adminEmail}" exists as '${existingUser.role}'. Promoting to 'admin'...`);
          existingUser.role = 'admin';
          await existingUser.save();
          console.log(`[SUCCESS] User "${adminEmail}" successfully promoted to administrator.`);
        }
      } else {
        const adminName = name ? name.trim() : 'Canteen Administrator';
        const user = await User.create({
          name: adminName,
          email: adminEmail,
          password: password,
          role: 'admin',
          phone: phone ? phone.trim() : null,
        });

        console.log('\n[SUCCESS] Administrator created successfully:');
        console.log(`  ID:    ${user._id}`);
        console.log(`  Name:  ${user.name}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role:  ${user.role}`);
      }
    }
  } catch (err) {
    console.error('\n[ERROR] Provisioning failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n[+] Disconnected from MongoDB.');
    process.exit(0);
  }
}

main();
