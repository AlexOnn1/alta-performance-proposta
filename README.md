# Alta Performance Mudanças

Protótipo de pedido de orçamento para apresentar à Elsa, em Curitiba. O cliente cadastra a mudança pelo celular e a equipe recebe uma ficha com os itens por cômodo, quantidades, serviços e observações.

## Instalar e executar

Use Node.js 20.19+, 22.12+ ou 24+, com npm. Na pasta do projeto, instale uma vez:

```sh
npm install
```

Inicie a demonstração com um comando:

```sh
npm start
```

Abra [http://localhost:4200](http://localhost:4200). A aplicação roda localmente após a instalação das dependências. O rascunho é mantido ao trocar de visão enquanto a página estiver aberta. Os dados da demonstração ficam na memória da página.

## Build de produção

```sh
npm run build
```

O comando compila o módulo React e gera a aplicação em `dist/alta-performance/browser/`. Sirva essa pasta por HTTP para abrir a versão de produção. O protótipo também funciona sem acesso à internet depois da instalação.

## Roteiro da apresentação

1. Em **Visão do cliente**, selecione **Carregar exemplo**. Confirme o trajeto Água Verde → Cabral, em Curitiba, e a opção **Data a combinar**.
2. Avance para **Itens por cômodo**. Em **Quarto**, desmarque **Montagem no destino** no guarda-roupa. Mantenha **Desmontagem na origem** marcada.
3. Selecione **Revisar pedido** e **Gerar ficha de orçamento**. Confira os serviços do guarda-roupa, a embalagem da TV e a observação **Frágil** nas caixas de louça.
4. Use **Voltar ao pedido**, mude a quantidade das caixas e gere a ficha outra vez. Use **Copiar resumo** para conferir o texto atualizado.
5. Em uma tela estreita, volte a **Dados da mudança**, clique em **Começar do zero** e digite um pedido próprio.

## Estrutura

- `src/app/` contém o cabeçalho, a navegação, o estado e a ficha em Angular. O componente hospedeiro monta o React com `createRoot` e o desmonta no fim de seu ciclo de vida.
- `src/react/` contém o formulário em React e TypeScript. O TypeScript gera um módulo JavaScript com declarações em `.compiled/`; o Angular importa o módulo compilado e recebe alterações e confirmações por callbacks tipados.
- `src/shared/order.ts` define o modelo, a validação, o exemplo e a formatação da ficha. A equipe vê a versão que o cliente confirmou, e uma nova confirmação atualiza a ficha.
- `src/styles.css` concentra os tokens, o Tailwind e sua detecção de classes para os templates e o código Angular e React. `public/alta-performance.png` é uma cópia do PNG original.


