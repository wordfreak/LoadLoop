import { PickingList } from "./picking-list"

export default async function PickPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <PickingList token={token} />
}
