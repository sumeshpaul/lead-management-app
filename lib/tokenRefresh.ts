export async function refreshToken(): Promise<void> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }
}
