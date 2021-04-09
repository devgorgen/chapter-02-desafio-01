import React, { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
      // Criando novo objeto para manter a imutabilidade
      const newSumAmount = {...sumAmount};

      /*
       (isso não é um array), esta apenas acessando uma propriedade do objeto,
       como nesse caso o objeto não tem essa propriedade ela sera criada e esta atribuindo um valor pra ela
       Ex: {1 : 4}
      */
     newSumAmount[product.id] = product.amount;

      return newSumAmount;
  }, {} as CartItemsAmount)

  useEffect(() => {
    async function loadProducts() {
      // Busca no repositorio a lista de produtos, passando a tipagem do retorno esperado direto pelo axios "<Product[]>".
      const response = await api.get<Product[]>('products');

      // Formatando o retorno os dados
      const data = response.data.map(product => ({
        ...product,
        priceFormatted: formatPrice(product.price) 
        }));

        setProducts(data);
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id);
  }

  return (
    <ProductList>
      {products.map(product => (
          <li key={product.id}>
            <img src={product.image} alt={product.title} />
            <strong>{product.title}</strong>
            <span>{product.priceFormatted}</span>
            <button
              type="button"
              data-testid="add-product-button"
              onClick={() => handleAddProduct(product.id)}
            >
              <div data-testid="cart-product-quantity">
                <MdAddShoppingCart size={16} color="#FFF" />
                {cartItemsAmount[product.id] || 0}
              </div>
    
              <span>ADICIONAR AO CARRINHO</span>
            </button>
        </li>
      ))}
    </ProductList>
  );
};

export default Home;
