# Navegação generativa para jornada do candidato — versão Vercel

Protótipo de baixa fidelidade para testar uma experiência do Vestibular FGV em que a pessoa candidata escreve uma busca em linguagem natural e a interface organiza cursos, formas de ingresso, fontes oficiais, próximos passos e formulário contextual quando fizer sentido.

## Como funciona

1. O candidato escreve uma pergunta.
2. A rota server-side `/api/generate-ui` envia a pergunta + base curada do Vestibular FGV para a OpenAI.
3. A resposta volta em JSON estruturado com intenção, entidades, etapa da jornada, componentes, próximo passo e regra de formulário.
4. O `index.html` renderiza a experiência com cards, comparador, agenda, links oficiais, próximos passos e captura de interesse.

## Arquivos

- `index.html` — interface pública do protótipo.
- `data/vestibular-content.json` — base curada com dados reais do Vestibular FGV.
- `api/generate-ui.js` — rota server-side para Vercel que chama a OpenAI com chave protegida.
- `vercel.json` — configuração simples do projeto na Vercel.

## Variáveis de ambiente na Vercel

Em **Project Settings > Environment Variables**, configure:

- `OPENAI_API_KEY` — recomendado.

Compatibilidade mantida:

- `api_vestibular` — também funciona, caso você queira manter o mesmo nome usado antes.

Opcionais:

- `OPENAI_MODEL` — padrão: `gpt-4o-mini`.
- `OPENAI_BASE_URL` — usar apenas se houver proxy/gateway.

Depois de adicionar ou alterar variáveis de ambiente, faça um novo deploy.

## Como subir no GitHub + Vercel

1. Crie um repositório no GitHub.
2. Suba estes arquivos para a raiz do repositório.
3. Na Vercel, clique em **Add New > Project**.
4. Importe o repositório do GitHub.
5. Mantenha o framework como **Other** ou **No Framework**.
6. Configure a variável `OPENAI_API_KEY`.
7. Faça o deploy.

## Perguntas para testar

- `posso usar minha nota do Enem para Direito em SP?`
- `quais cursos existem no Rio de Janeiro?`
- `qual a diferença entre Administração e Administração Pública?`
- `ainda dá tempo de me inscrever em Ciência de Dados?`
- `tem prova antiga de Administração em São Paulo?`
- `quero estudar algo com dados e tecnologia`
- `me avise quando abrir ENEM para Direito em São Paulo`

## Observações

- A chave da OpenAI não fica no navegador; ela é lida apenas na função `/api/generate-ui`.
- Se a variável de ambiente não estiver configurada ou a API falhar, o protótipo usa um fallback local simples por palavra-chave.
- O formulário de interesse ainda salva apenas no `localStorage` do navegador. Em uma versão pública real, ele deve ser conectado a CRM, Drupal, planilha, RD Station, Salesforce ou outro destino seguro.
- As informações críticas de prazo, valor, edital, vagas e documentação devem sempre ser validadas nas páginas oficiais e no edital.
