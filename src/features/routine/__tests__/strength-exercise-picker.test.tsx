import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { StrengthExercisePicker } from "@/features/routine/components/strength-exercise-picker"

describe("StrengthExercisePicker", () => {
  it("supports search, filter, and selection with metadata binding", async () => {
    const user = userEvent.setup()
    const onSelectExercise = vi.fn()

    render(
      <StrengthExercisePicker
        selectedExerciseIds={[]}
        onSelectExercise={onSelectExercise}
      />
    )

    const searchInput = screen.getByLabelText("Search exercises")
    await user.type(searchInput, "split")

    await user.click(screen.getByLabelText("Filter by equipment dumbbell"))
    await user.click(screen.getByLabelText("Filter by muscle quadriceps"))

    const option = await screen.findByRole("option", {
      name: /Bulgarian Split Squat/i
    })

    option.focus()
    await user.keyboard("{Enter}")

    expect(onSelectExercise).toHaveBeenCalledTimes(1)
    expect(onSelectExercise).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ex-2",
        canonicalName: "Bulgarian Split Squat",
        equipment: ["dumbbell", "bench"],
        primaryMuscles: ["quadriceps", "glutes"]
      })
    )
  })

  it("respects pre-selected exercise ids by disabling add action", async () => {
    render(
      <StrengthExercisePicker
        selectedExerciseIds={["ex-1"]}
        onSelectExercise={vi.fn()}
      />
    )

    const preselected = await screen.findByRole("option", {
      name: /Back Squat/i
    })
    expect(preselected).toHaveAttribute("aria-disabled", "true")
  })
})
