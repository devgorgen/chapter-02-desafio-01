import { createContext, ReactNode, useContext, useState, useRef, useEffect } from 'react';
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

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  /*
    Usando useRef para a cada atualização comparar o esado da carrinho para se ouver diferença atualizar o localstorage
  */  
  const prevCartRef = useRef<Product[]>();

  useEffect(() => {
    prevCartRef.current = cart;
  });

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

    }
  }, [cartPreviousValue, cart]);

  // -------------------------- //


  // Hook para adicionar produtos
  const addProduct = async (productId: number) => {
    try {
      // Mantendo a imutabilidade.
      const updatedCart = [...cart]; 
      
      // Verificando se o produto existe no carrinho.
      const productExists = updatedCart.find(product => product.id === productId); 

      // Buscando produto do stock.
      const stock = await api.get(`/stock/${productId}`);

      // Quantidade do produto no estoque.
      const stockAmount = stock.data.amount;

      // quantidade atual do produto no carrinho.
      const currentAmount = productExists ? productExists.amount : 0;

      // Quantidade desejada
      const amount = currentAmount + 1;

      // Verifico se a quantidade solicitada é maior que o estoque do produto.
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        //se já existe no carrinho apenas atualizo a quantidade.
        productExists.amount = amount;
      } else {
        // produto ainda não existe no carrinho e precisa ser adicionado.
        const product = await api.get(`/products/${productId}`);

        // Como é um novo produto no carrinho, preciso adicionar a propriedade amount.
        const newProduct = {
          ...product.data,
          amount: 1
        }

        // Adicionando o nove produto ao carrinho.
        updatedCart.push(newProduct);
      }

      // Atualizando estado do carrinho com novo carrinho atualizado.
      setCart(updatedCart);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // Criando novo objeto para garantir imutabilidade
      const updatedCart = [...cart];

      // Busco index do produto a ser removido.
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      // Verifico se encontrou o id, se não encontrar vai retornar -1
      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      // Buscando produto do stock.
      const stock = await api.get(`/stock/${productId}`);

      // Quantidade do produto no estoque.
      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
      } else {
        throw Error();
      }
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
