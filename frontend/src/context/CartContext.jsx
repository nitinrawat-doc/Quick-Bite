import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'qb_cart_items';

const getInitialItems = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse cart from localStorage:', e);
    return [];
  }
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i._id === action.item._id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i._id === action.item._id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, qty: 1 }] };
    }
    case 'REMOVE': {
      const existing = state.items.find((i) => i._id === action.id);
      if (!existing) return state;
      if (existing.qty === 1) {
        return { ...state, items: state.items.filter((i) => i._id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i._id === action.id ? { ...i, qty: i.qty - 1 } : i
        ),
      };
    }
    case 'DELETE':
      return { ...state, items: state.items.filter((i) => i._id !== action.id) };
    case 'CLEAR':
      return { ...state, items: [] };
    case 'TOGGLE_DRAWER':
      return { ...state, isOpen: !state.isOpen };
    case 'OPEN_DRAWER':
      return { ...state, isOpen: true };
    case 'CLOSE_DRAWER':
      return { ...state, isOpen: false };
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: getInitialItems(),
    isOpen: false,
  });

  // Sync cart items with localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [state.items]);

  const addItem    = useCallback((item) => dispatch({ type: 'ADD', item }), []);
  const removeItem = useCallback((id)   => dispatch({ type: 'REMOVE', id }), []);
  const deleteItem = useCallback((id)   => dispatch({ type: 'DELETE', id }), []);
  const clearCart  = useCallback(()     => dispatch({ type: 'CLEAR' }), []);
  const openCart   = useCallback(()     => dispatch({ type: 'OPEN_DRAWER' }), []);
  const closeCart  = useCallback(()     => dispatch({ type: 'CLOSE_DRAWER' }), []);
  const toggleCart = useCallback(()     => dispatch({ type: 'TOGGLE_DRAWER' }), []);

  const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = state.items.reduce(
    (sum, i) => sum + (i.sellingPrice ?? i.price ?? 0) * i.qty,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        deleteItem,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
