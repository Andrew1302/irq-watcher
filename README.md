# IRQ Watcher

API para monitoramento de interrupções e métricas do sistema Linux.

## Pré-requisitos

- Go 1.22.2 ou superior
- Sistema Linux (para acessar `/proc/stat` e `/proc/interrupts`)

## Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd irq-watcher-api
```

2. Instale as dependências:
```bash
go mod tidy
```

## Executando Localmente

### Opção 1: Executar com `go run` (Desenvolvimento)

```bash
go run get_proc_info.go
```

O servidor estará disponível em `http://localhost:8080`

### Opção 2: Build e Executar

```bash
# Compilar o binário
go build -o irq-watcher get_proc_info.go

# Executar
./irq-watcher
```

O servidor estará disponível em `http://localhost:8080`

## Executando no Raspberry Pi


### Cross-compile no Laptop e execute na Raspberry Pi


#### Passo 1: Cross-compile no seu laptop
```bash
# No diretório do projeto no seu laptop
GOOS=linux GOARCH=arm GOARM=6 go build -o irq-watcher-arm get_proc_info.go
```

#### Passo 2: Transferir para o Raspberry Pi
```bash
# Copiar o binário para o Pi (substitua pelo IP correto)
scp irq-watcher-arm pi@192.168.1.100:/home/pi/
```

#### Passo 3: Executar no Raspberry Pi
```bash
# Conectar via SSH
ssh pi@192.168.1.100

# Tornar executável e rodar
chmod +x irq-watcher-arm
./irq-watcher-arm
```

## Script de Deploy Automatizado

Crie um script para facilitar o deploy:

```bash
#!/bin/bash
# deploy.sh - salve no diretório do projeto

RASPBERRY_IP="192.168.1.100"  # Altere para o IP do seu Pi

echo "Compilando para Raspberry Pi..."
GOOS=linux GOARCH=arm GOARM=6 go build -o irq-watcher-arm get_proc_info.go

echo "Copiando para Raspberry Pi..."
scp irq-watcher-arm pi@$RASPBERRY_IP:/home/pi/

echo "Executando no Raspberry Pi..."
ssh pi@$RASPBERRY_IP "cd /home/pi && chmod +x irq-watcher-arm && ./irq-watcher-arm"
```

**Tornar executável e usar:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## Testando a Conexão

### Do seu laptop para o Raspberry Pi:

```bash
# Testar a API
curl http://192.168.1.100:8080/metrics

# Abrir Swagger UI no navegador
# http://192.168.1.100:8080/docs/
```

### Script de teste:

```bash
#!/bin/bash
# test_connection.sh

RASPBERRY_IP="192.168.1.100"  # Altere para o IP do seu Pi

echo "Testando IRQ Watcher API..."
curl -s http://$RASPBERRY_IP:8080/metrics | python3 -m json.tool
```

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
2. Verificar se as dependências estão instaladas: `go mod tidy`

## Estrutura do Projeto

```
irq-watcher-api/
├── get_proc_info.go    # Código principal
├── go.mod              # Dependências Go
├── go.sum              # Checksums das dependências
├── docs/               # Documentação Swagger gerada
│   ├── docs.go
│   ├── swagger.json
│   └── swagger.yaml
└── README.md           # Este arquivo
```