import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "../../lib/utils"

const isDeprecatedDicebearUrl = (src) => {
  if (!src || typeof src !== "string") {
    return false
  }

  const trimmed = src.trim()
  if (!trimmed) {
    return false
  }

  // Ignore data/blob/local assets
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.startsWith("/")) {
    return false
  }

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
  if (!hasProtocol) {
    return false
  }

  try {
    const { hostname, pathname } = new URL(trimmed)
    const host = hostname.toLowerCase()
    const path = pathname || ""

    if (host.includes("avatars.dicebear.com")) {
      return true
    }

    if (host === "api.dicebear.com" && !path.startsWith("/7.x/")) {
      return true
    }
  } catch (err) {
    return false
  }

  return false
}

const sanitizeAvatarSrc = (src) => {
  if (!src || typeof src !== "string") {
    return undefined
  }

  const trimmed = src.trim()
  if (!trimmed) {
    return undefined
  }

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.startsWith("/")) {
    return trimmed
  }

  if (isDeprecatedDicebearUrl(trimmed)) {
    return undefined
  }

  return trimmed
}

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props} />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef(({ className, src, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    src={sanitizeAvatarSrc(src)}
    {...props} />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props} />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
