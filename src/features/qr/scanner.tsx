"use client"

import { useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Scan, X } from "lucide-react"

export function QrScanner({
  onScan,
  scanning,
  onToggle,
}: {
  onScan: (token: string) => void
  scanning: boolean
  onToggle: () => void
}) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const onScanRef = useRef(onScan)
  const onToggleRef = useRef(onToggle)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    onToggleRef.current = onToggle
  }, [onToggle])

  const stopScanner = useCallback(async () => {
    if (instanceRef.current) {
      await instanceRef.current.stop()
      instanceRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!scanning || !scannerRef.current) return

    let mounted = true

    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scanner = new Html5Qrcode("qr-scanner")

      instanceRef.current = { stop: () => scanner.stop() }

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            if (mounted) {
              onScanRef.current(decoded)
              scanner.stop()
              onToggleRef.current()
            }
          },
          () => {}
        )
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : ""
          if (message.includes("permission") || message.includes("NotAllowed")) {
            alert("Camera access denied. Please allow camera access in your browser settings.")
          }
          onToggleRef.current()
        }
      }
    }

    start()

    return () => {
      mounted = false
      stopScanner()
    }
  }, [scanning, stopScanner])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="gap-2"
      >
        {scanning ? (
          <>
            <X className="h-4 w-4" />
            Stop Scanning
          </>
        ) : (
          <>
            <Scan className="h-4 w-4" />
            Scan QR
          </>
        )}
      </Button>
      {scanning && (
        <div className="rounded-lg overflow-hidden border">
          <div id="qr-scanner" ref={scannerRef} className="w-full" />
        </div>
      )}
    </>
  )
}
