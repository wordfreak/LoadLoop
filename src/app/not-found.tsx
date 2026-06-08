import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Link
          href="/"
          className="text-sm text-primary hover:underline"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
