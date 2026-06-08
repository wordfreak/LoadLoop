import { ReturnCheckIn } from "./return-check-in"

export default async function ReturnPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <ReturnCheckIn token={token} />
}
