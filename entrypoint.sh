#!/bin/bash
set -euo pipefail

# Inicia o Ollama em segundo plano
/bin/ollama serve &
pid=$!

# Aguarda o serviço do Ollama subir na porta 11434
echo "Aguardando o Ollama iniciar..."
while ! timeout 1 bash -c "echo > /dev/tcp/localhost/11434" 2>/dev/null; do
  sleep 1
done
echo "Ollama iniciado."

# Baixa o modelo desejado (altere 'llama3.2' para o modelo que você quer)
echo "Baixando o modelo..."
ollama pull nomic-embed-text:latest
ollama pull llama3:latest

# Mantém o processo principal do container rodando
wait $pid
