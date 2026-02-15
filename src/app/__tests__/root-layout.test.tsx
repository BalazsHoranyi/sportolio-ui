import { renderToStaticMarkup } from "react-dom/server"

import RootLayout from "@/app/layout"

describe("RootLayout", () => {
  it("provides a keyboard-accessible skip link to main content", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <main id="main-content">child</main>
      </RootLayout>
    )

    expect(markup).toContain('href="#main-content"')
    expect(markup).toContain("Skip to main content")
  })
})
