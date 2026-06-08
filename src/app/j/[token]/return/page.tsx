export default async function ReturnPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Return Check-In</h1>
        <p className="text-muted-foreground mt-2">Token: {token}</p>
      </div>
    </div>
  )
}
