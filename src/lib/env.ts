export const env = {
  get DATABASE_URL() {
    return process.env.DATABASE_URL
  },
  get NEXTAUTH_SECRET() {
    return process.env.NEXTAUTH_SECRET
  },
  get NEXTAUTH_URL() {
    return process.env.NEXTAUTH_URL
  },
  get CLOUDINARY_CLOUD_NAME() {
    return process.env.CLOUDINARY_CLOUD_NAME
  },
  get CLOUDINARY_API_KEY() {
    return process.env.CLOUDINARY_API_KEY
  },
  get CLOUDINARY_API_SECRET() {
    return process.env.CLOUDINARY_API_SECRET
  },
  get NEXT_PUBLIC_APP_URL() {
    return process.env.NEXT_PUBLIC_APP_URL
  },
  get RESEND_API_KEY() {
    return process.env.RESEND_API_KEY
  },
}

const requiredVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
] as const

export function validateEnvironment() {
  const missing = requiredVars.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    )
  }
}
