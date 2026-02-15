import { render, screen } from "@testing-library/react"

import { MuscleMap } from "@/features/muscle-map/components/muscle-map"

vi.mock("react-muscle-highlighter", () => ({
  __esModule: true,
  default: ({
    data,
    side
  }: {
    data: Array<{ slug?: string; intensity?: number }>
    side: "front" | "back"
  }) => (
    <div
      data-testid={`body-${side}`}
      data-side={side}
      data-body-data={JSON.stringify(data)}
    />
  )
}))

describe("MuscleMap", () => {
  it("renders front/back maps and passes mapped highlight data", () => {
    render(
      <MuscleMap
        title="Routine Muscle Map"
        contributions={[
          { muscle: "quadriceps", score: 2 },
          { muscle: "glutes", score: 1 }
        ]}
      />
    )

    const front = screen.getByTestId("body-front")
    const back = screen.getByTestId("body-back")

    expect(front).toBeInTheDocument()
    expect(back).toBeInTheDocument()

    const mapped = front.getAttribute("data-body-data") ?? "[]"
    expect(mapped).toContain('"slug":"quadriceps"')
    expect(mapped).toContain('"slug":"gluteal"')

    expect(
      screen.getByRole("list", { name: "Routine Muscle Map contributions" })
    ).toBeInTheDocument()
  })

  it("shows an empty state when there are no mapped contributions", () => {
    render(
      <MuscleMap
        title="Exercise Muscle Map"
        contributions={[{ muscle: "unknown", score: 1 }]}
      />
    )

    expect(screen.getByText("No mapped muscles to display yet.")).toBeVisible()
  })
})
