"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type {
  ApiEnvelope,
  AuthRole,
  AuthenticatedActor
} from "@/features/auth/types"

type SessionResponse = ApiEnvelope<{ actor: AuthenticatedActor }>
type OnboardingResponse = ApiEnvelope<{ actor: AuthenticatedActor }>

function readErrorMessage(payload: ApiEnvelope<unknown> | null): string {
  if (payload?.error?.message) {
    return payload.error.message
  }
  return "Request failed. Try again."
}

export function OnboardingForm() {
  const router = useRouter()
  const [actor, setActor] = useState<AuthenticatedActor | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [primaryModality, setPrimaryModality] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [coachingFocus, setCoachingFocus] = useState("")
  const [athleteCapacity, setAthleteCapacity] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadSession() {
      const response = await fetch("/api/auth/session")
      const payload = (await response.json()) as SessionResponse

      if (!response.ok || !payload.data?.actor) {
        router.replace("/login")
        return
      }

      if (payload.data.actor.onboarding_completed) {
        router.replace("/")
        return
      }

      setActor(payload.data.actor)
    }

    loadSession().catch(() => {
      router.replace("/login")
    })
  }, [router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actor) {
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    const role = actor.role as AuthRole
    const context =
      role === "athlete"
        ? {
            primary_modality: primaryModality,
            experience_level: experienceLevel
          }
        : {
            coaching_focus: coachingFocus,
            athlete_capacity: Number.parseInt(athleteCapacity, 10)
          }

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          display_name: displayName,
          role,
          context
        })
      })
      const payload = (await response.json()) as OnboardingResponse
      if (!response.ok || !payload.data?.actor) {
        setErrorMessage(readErrorMessage(payload))
        return
      }

      router.replace("/")
    } catch {
      setErrorMessage("Request failed. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg space-y-5 p-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Complete onboarding</h2>
        <p className="text-sm text-muted-foreground">
          Finish role-specific setup to unlock planning routes.
        </p>
      </header>

      {actor ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="onboarding-display-name">Display name</Label>
            <Input
              id="onboarding-display-name"
              aria-label="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>

          {actor.role === "athlete" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="onboarding-primary-modality">
                  Primary modality
                </Label>
                <Input
                  id="onboarding-primary-modality"
                  aria-label="Primary modality"
                  value={primaryModality}
                  onChange={(event) => setPrimaryModality(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-experience-level">
                  Experience level
                </Label>
                <Input
                  id="onboarding-experience-level"
                  aria-label="Experience level"
                  value={experienceLevel}
                  onChange={(event) => setExperienceLevel(event.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="onboarding-coaching-focus">
                  Coaching focus
                </Label>
                <Input
                  id="onboarding-coaching-focus"
                  aria-label="Coaching focus"
                  value={coachingFocus}
                  onChange={(event) => setCoachingFocus(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-athlete-capacity">
                  Athlete capacity
                </Label>
                <Input
                  id="onboarding-athlete-capacity"
                  aria-label="Athlete capacity"
                  type="number"
                  min={1}
                  value={athleteCapacity}
                  onChange={(event) => setAthleteCapacity(event.target.value)}
                  required
                />
              </div>
            </>
          )}

          {errorMessage ? (
            <p role="alert" className="text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Complete onboarding"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Loading session...</p>
      )}
    </Card>
  )
}
