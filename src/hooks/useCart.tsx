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
      const updatedCart = [...cart];
      const existsProduct = updatedCart.find(product => product.id === productId);

      const currentAmount = existsProduct ? existsProduct.amount : 0;
      const totalAmount = currentAmount + 1;

      const stockResponse = await api.get(`stock/${productId}`);
      const productsInStock = stockResponse.data.amount;

      if(productsInStock < totalAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(existsProduct) {
        existsProduct.amount = totalAmount;
      } else {
        const productResponse = await api.get<ProductResponse>(`products/${productId}`);
        const { id, title, price, image } = productResponse.data;

        const newProduct = {
          id,
          title,
          price,
          image,
          amount: totalAmount,
        };

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartToUpdate = [ ...cart ];
      const productIndex = cartToUpdate.findIndex((product) => product.id === productId);
      const productNotExistInCart = productIndex === -1;

      if (productNotExistInCart) {
        throw new Error('nonexistent product in the cart');
      }

      cartToUpdate.splice(productIndex, 1);

      setCart(cartToUpdate);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartToUpdate));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart];

      if(amount < 1) {
        throw new Error('The quantity of this product in cart is equal to or less than zero');
      }
  
      const produtcToRemoveIndex = updatedCart.findIndex(product => productId === product.id);
      const productNotExistInCart = produtcToRemoveIndex === -1;

      if(productNotExistInCart) {
        throw new Error('nonexistent product in the cart');
      }
  
      const stockReponse = await api.get(`stock/${productId}`);
      const { amount : productsInStock } = stockReponse.data;
  
      if(productsInStock < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      updatedCart[produtcToRemoveIndex].amount = amount;

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
