# IRQ Watcher - Monitor de Interrupções

O IRQ Watcher é uma ferramenta educativa desenvolvida para visualizar e monitorar em tempo real as interrupções de hardware (IRQs) durante o uso normal do computador. A aplicação permite observar de forma intuitiva como diferentes atividades do sistema - desde movimentar o mouse até acessar arquivos ou navegar na internet - geram interrupções específicas nos componentes de hardware. O sistema categoriza as interrupções por tipo (rede, armazenamento, USB, entrada, GPU, áudio, energia, temporizador, inter-CPU, kernel, PCIe, virtualização, GPIO e sistema), mostrando através de gráficos dinâmicos a distribuição entre os núcleos do processador e a evolução temporal da atividade. Esta visualização prática ajuda a compreender conceitos fundamentais da arquitetura de computadores e o funcionamento interno do sistema operacional, transformando dados abstratos de IRQs em informações visuais acessíveis para fins didáticos e de análise de performance do sistema.

O frontend foi desenvolvido em React com Next.js oferecendo três modos principais de visualização: por núcleos do processador, por categorias de interrupção e uma visão detalhada que cruza ambas as dimensões. Os gráficos são renderizados dinamicamente usando Chart.js, permitindo análise estática dos dados atuais e também monitoramento temporal contínuo que coleta até 300 pontos históricos para visualizar a evolução das interrupções ao longo do tempo. A interface possui filtros interativos onde o usuário pode selecionar quais núcleos e categorias deseja monitorar, com opções para agrupar todas as interrupções em uma única linha ou visualizar cada categoria separadamente.

O sistema monitora múltiplas categorias distintas de interrupções, cada uma revelando aspectos específicos da atividade do computador. As interrupções de sistema, temporizador e kernel são fundamentais para o funcionamento básico, gerenciando o agendamento de tarefas, sincronização e operações internas do núcleo com frequências muito altas. As categorias de entrada, USB e rede refletem diretamente a interação do usuário e conectividade, mostrando picos quando se usa teclado, mouse ou navega na internet. O armazenamento e GPU indicam atividades de leitura/escrita de arquivos e processamento gráfico respectivamente. As interrupções de energia monitoram o gerenciamento térmico e eficiência energética, enquanto áudio captura atividades de processamento sonoro. Categorias especializadas como inter-CPU mostram comunicação entre processadores, PCIe monitora dispositivos conectados via PCIe/Thunderbolt, virtualização acompanha ambientes virtualizados (VirtIO, Hyper-V), e GPIO/sensores capturam dispositivos de baixo nível, proporcionando uma visão abrangente do ecossistema de hardware ativo no sistema.

A aplicação implementa um sistema de proxy interno para contornar limitações de CORS ao conectar com APIs backend externas, além de hooks customizados para gerenciamento de estado e auto-refresh configurável dos dados. O design responsivo utiliza CSS Modules para estilização, enquanto componentes são carregados dinamicamente para otimizar performance. A interface exibe métricas complementares como utilização de CPU, tempo ocioso e número de trocas de contexto, proporcionando uma visão holística da atividade do sistema.

O monitoramento temporal calcula automaticamente a taxa de amostragem da API e usa o primeiro ponto coletado como baseline, mostrando incrementos relativos das interrupções desde o início da sessão. Esta abordagem permite identificar padrões de uso, picos de atividade específicos e correlacionar eventos do usuário com a resposta dos componentes de hardware, tornando conceitos abstratos de arquitetura de computadores tangíveis através de visualização interativa em tempo real.

## Como usar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` e configure a URL da API backend para começar o monitoramento.
