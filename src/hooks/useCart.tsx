import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

type ProductResponse = Omit<Product, 'amount'>

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stockReponse = await api.get(`/stock?id=${productId}`)
      const { amount : productsInStock } = stockReponse.data[0];
      
      const productIndex = cart.findIndex(product => productId === product.id);

      const productExistsInCart = productIndex !== -1;
      
      if(productExistsInCart) {
        const product = {...cart[productIndex]};
        product.amount += 1;

        const updatedCart = [ ...cart ];
        updatedCart[productIndex] = product;
        
        if(productsInStock < product.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        if(productsInStock < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const productResponse = await api.get<ProductResponse[]>(`/products?id=${productId}`);
        const { id, image, price, title } = productResponse.data[0];

        const newProduct = { id, image, price, title, amount: 1 };

        const updatedCart = [ ...cart,  newProduct ];

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }

    } catch(error) {
      console.error(error);
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
