# IRQ Watcher

API para monitoramento de interrupções e métricas do sistema Linux com dashboard web.

## Estrutura do Projeto

```
irq-watcher/
├── api/                    # Backend Go
│   ├── main.go            # Servidor da API
│   ├── go.mod
│   ├── go.sum
│   └── docs/              # Documentação Swagger
├── web/                   # Frontend Web
│   ├── index.html         # Dashboard principal
│   ├── style.css          # Estilos
│   └── script.js          # JavaScript
├── scripts/               # Scripts de build e deploy
│   ├── build.sh
│   └── deploy.sh
└── README.md
```

## Pré-requisitos

- Go 1.22.2 ou superior
- Sistema Linux (para acessar `/proc/stat` e `/proc/interrupts`)
- Navegador web moderno

## Instalação

1. Clone o repositório:
```bash
git clone andrew1302/irq-watcher
cd irq-watcher-api
```

2. Instale as dependências do backend:
```bash
cd api
go mod tidy
cd ..
```

## Executando Localmente

### Backend (API)

#### Opção 1: Executar com `go run` (Desenvolvimento)
```bash
cd api
go run main.go
```

#### Opção 2: Build e Executar (Produção)
```bash
cd api
go build -o irq-watcher main.go
./irq-watcher
```

O servidor estará disponível em `http://localhost:8080`


## Executando no Raspberry Pi

### Deploy Automatizado (Recomendado)

```bash
# Execute o script de deploy
./scripts/deploy.sh
```

**Nota:** Edite o script `scripts/deploy.sh` e altere o IP do Raspberry Pi.

### Forward da porta com ngrok
```bash
ngrok http http://localhost:8080
```

### Caso não tenha instalado ainda:

```bash
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
  && echo "deb https://ngrok-agent.s3.amazonaws.com bookworm main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list \
  && sudo apt update \
  && sudo apt install ngrok

ngrok config add-authtoken 31KLSJHIiL6FMGITwYSY3Ko7UvG_6QmaDd1twp2WpEqQZ14y6

```

### Deploy Manual

#### Passo 1: Cross-compile no seu laptop
```bash
cd api
GOOS=linux GOARCH=arm GOARM=6 go build -o ../bin/irq-watcher-arm main.go
cd ..
```

#### Passo 2: Transferir para o Raspberry Pi
```bash
# Copiar o binário para o Pi (substitua pelo IP correto)
scp bin/irq-watcher-arm pi@192.168.1.100:/home/pi/
```

#### Passo 3: Executar no Raspberry Pi
```bash
# Conectar via SSH
ssh pi@192.168.1.100

# Tornar executável e rodar
chmod +x irq-watcher-arm
./irq-watcher-arm
```

## Configuração do Frontend

Para conectar o frontend ao Raspberry Pi:

1. Edite o arquivo `web/script.js`
2. Altere a linha 4: `this.apiUrl = 'http://192.168.1.100:8080';`
3. Substitua `192.168.1.100` pelo IP do seu Raspberry Pi

## Scripts Disponíveis

### Build
```bash
./scripts/build.sh
```
Compila o backend para desenvolvimento local e Raspberry Pi.

### Deploy
```bash
./scripts/deploy.sh
```
Compila e faz deploy automático para o Raspberry Pi.

## Testando a Conexão

### Do seu laptop para o Raspberry Pi:

```bash
# Testar a API
curl http://192.168.1.100:8080/metrics

# Abrir Swagger UI no navegador
# http://192.168.1.100:8080/docs/
```


## Endpoints da API

- `GET /metrics` - Retorna métricas de interrupções e uso de CPU
- `GET /docs/` - Interface Swagger para documentação da API


## Solução de Problemas

### Porta já em uso:
```bash
# Encontrar processo usando a porta 8080
lsof -i :8080

# Matar o processo
sudo kill -9 $(lsof -t -i:8080)
```

### Problemas de rede:
1. Verificar se ambos os dispositivos estão na mesma rede WiFi
2. Verificar se o firewall não está bloqueando a porta 8080
3. Tentar uma porta diferente (ex: 8081)

### Problemas de compilação:
1. Verificar se o Go está instalado corretamente
2. Verificar se as dependências estão instaladas: `cd api && go mod tidy`

### Problemas do frontend:
1. Verificar se o IP do Raspberry Pi está correto em `web/script.js`
2. Verificar se a API está rodando no Pi
3. Verificar o console do navegador para erros

## Mantendo o Servidor Rodando

### Usando Screen (Recomendado para SSH):
```bash
# Conectar via SSH
ssh pi@192.168.1.100

# Iniciar uma sessão screen
screen -S irq-watcher

# Executar o servidor
./irq-watcher-arm

# Desconectar da screen: Ctrl+A, depois D
# Reconectar depois: screen -r irq-watcher
```

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request
