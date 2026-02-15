import type { ExtendedBodyPart, Slug } from "react-muscle-highlighter"

import type { MuscleContribution } from "@/features/muscle-map/types"

export type BodyPartContribution = {
  slug: Slug
  score: number
}

const MUSCLE_TO_BODY_PART: Record<string, Slug> = {
  abdominals: "abs",
  core: "abs",
  adductors: "adductors",
  biceps: "biceps",
  calves: "calves",
  chest: "chest",
  pectorals: "chest",
  anterior_deltoids: "deltoids",
  lateral_deltoids: "deltoids",
  rear_deltoids: "deltoids",
  shoulders: "deltoids",
  forearms: "forearm",
  glutes: "gluteal",
  hamstrings: "hamstring",
  erector_spinae: "lower-back",
  obliques: "obliques",
  quadriceps: "quadriceps",
  tibialis_anterior: "tibialis",
  trapezius: "trapezius",
  upper_traps: "trapezius",
  mid_traps: "trapezius",
  triceps: "triceps",
  lats: "upper-back",
  rhomboids: "upper-back"
}

function normalizeScore(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function orderContributions(
  scoreByBodyPart: Record<Slug, number>
): BodyPartContribution[] {
  return Object.entries(scoreByBodyPart)
    .map(([slug, score]) => ({
      slug: slug as Slug,
      score: normalizeScore(score)
    }))
    .sort((left, right) => {
      if (right.score === left.score) {
        return left.slug.localeCompare(right.slug)
      }
      return right.score - left.score
    })
}

export function aggregateMuscleContributions(
  contributions: MuscleContribution[]
): BodyPartContribution[] {
  const scoreByBodyPart = {} as Record<Slug, number>

  for (const contribution of contributions) {
    const slug = MUSCLE_TO_BODY_PART[contribution.muscle]
    if (!slug) {
      continue
    }
    scoreByBodyPart[slug] =
      (scoreByBodyPart[slug] ?? 0) + Math.max(contribution.score, 0)
  }

  return orderContributions(scoreByBodyPart)
}

export function mapMuscleContributionsToBodyData(
  contributions: MuscleContribution[]
): ExtendedBodyPart[] {
  const mapped = aggregateMuscleContributions(contributions)
  const maxScore = mapped[0]?.score ?? 0

  if (maxScore <= 0) {
    return []
  }

  return mapped.map((item) => ({
    slug: item.slug,
    intensity: Math.max(1, Math.ceil((item.score / maxScore) * 5))
  }))
}
