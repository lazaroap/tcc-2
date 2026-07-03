# Validação do ConectaServ

A validação do ConectaServ tem foco na experiência do usuário final e combina o
**System Usability Scale (SUS)** — instrumento consolidado na literatura de
Interação Humano-Computador — com perguntas sobre o valor percebido do sistema e
questões abertas.

O público da validação são usuários que buscam recomendações de prestadores. O
banco de dados é populado previamente (seed) com prestadores, avaliações e
recomendações, de modo que o participante explora o sistema completo sem depender
de um prestador cadastrado durante o teste. Cada participante utiliza o sistema
publicado em https://conectaserv.onrender.com por cerca de 10 a 15 minutos —
criando uma conta, entrando ou criando um grupo, solicitando uma recomendação,
recomendando um prestador e registrando uma avaliação — e então responde ao
formulário com base nessa experiência.

## Estrutura do formulário

O formulário foi organizado em quatro seções.

### Seção 1 — Contexto

Caracteriza como o participante costuma encontrar prestadores de serviço
(encanador, eletricista, diarista, etc.), evidenciando o problema que o sistema
aborda. Múltipla escolha:

- Indicação de conhecidos (família, amigos, vizinhos)
- Google / busca na internet
- Redes sociais ou grupos de WhatsApp
- Não costumo procurar / outro

### Seção 2 — Usabilidade (SUS)

Dez afirmações respondidas em escala de 1 (discordo totalmente) a 5 (concordo
totalmente):

1. Eu gostaria de usar este sistema com frequência.
2. Achei o sistema desnecessariamente complexo.
3. Achei o sistema fácil de usar.
4. Acho que precisaria de ajuda de uma pessoa técnica para conseguir usar o sistema.
5. Achei que as várias funções do sistema estavam bem integradas.
6. Achei que havia muita inconsistência no sistema.
7. Imagino que a maioria das pessoas aprenderia a usar o sistema rapidamente.
8. Achei o sistema complicado/incômodo de usar.
9. Eu me senti confiante ao usar o sistema.
10. Precisei aprender várias coisas antes de conseguir usar o sistema.

### Seção 3 — Valor do sistema

Três afirmações na mesma escala de 1 a 5:

11. A ideia de receber recomendações de prestadores **dentro de grupos de
    confiança** me parece útil.
12. Eu usaria o ConectaServ pra encontrar um prestador de serviço na vida real.
13. Eu recomendaria o ConectaServ para um amigo.

### Seção 4 — Questões abertas

14. O que você **mais gostou**?
15. O que **faltou** ou o que você **melhoraria**?
16. Encontrou algum **erro ou dificuldade**? Qual?

## Cálculo da nota SUS

A pontuação considera apenas as dez afirmações da Seção 2. Para cada resposta
(valor de 1 a 5):

- Afirmações ímpares (1, 3, 5, 7, 9): pontos = `valor − 1`
- Afirmações pares (2, 4, 6, 8, 10): pontos = `5 − valor`

A soma dos dez itens (0 a 40) é multiplicada por 2,5, resultando na nota
individual de 0 a 100. A nota final do sistema corresponde à média das notas
individuais. Como referência, respostas ideais (ímpares = 5, pares = 1) resultam
em 40 × 2,5 = 100.

## Interpretação

A leitura da nota segue o benchmark consolidado por Sauro e Bangor, no qual 68
representa a média de mercado usada como referência:

| Nota SUS | Interpretação  |
| -------- | -------------- |
| > 68     | acima da média |
| 74–80    | bom            |
| 80+      | excelente      |

## Amostra

A validação considera um mínimo de 5 respondentes — patamar indicado por Nielsen
para avaliações de usabilidade —, sendo desejável de 8 a 12 para maior robustez.
Os participantes respondem logo após utilizar o sistema, com a impressão recente,
garantindo que a avaliação reflita o uso real.
