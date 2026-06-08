"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Invalid email or password")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-sm space-y-8 animate-slide-up">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-sidebar-primary flex items-center justify-center mb-4">
            <span className="text-sm font-bold text-sidebar-primary-foreground">
              LL
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-sidebar-foreground">
            LoadLoop
          </h1>
          <p className="text-sm text-sidebar-foreground/60 mt-1.5">
            Sign in to your equipment control system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sidebar-foreground/80">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="owner@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sidebar-foreground/80">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full h-11"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  )
}
