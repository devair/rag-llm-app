/**
 * Fonte única de configuração da URL base da API.
 *
 * Regras:
 * - Em desenvolvimento local (vite), usa http://localhost:3000.
 * - Em produção (Docker/nginx), usa o caminho relativo "/api", pois o nginx
 *   do container do client faz proxy das requisições para o backend.
 */
const LEGACY_DEV_API_URL = 'http://localhost:3000'

function resolveApiBaseUrl(): string {
    const configured = import.meta.env.VITE_API_BASE_URL as string | undefined
    if (configured) return configured

    // Servido pelo nginx dentro do Docker: o proxy /api/ cuida do encaminhamento.
    if (import.meta.env.PROD) return ''

    return LEGACY_DEV_API_URL
}

export const API_BASE_URL = resolveApiBaseUrl()