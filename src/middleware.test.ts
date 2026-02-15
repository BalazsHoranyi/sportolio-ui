import { config } from "./middleware"

describe("middleware matcher", () => {
  it("includes the exact /coach route and nested coach paths", () => {
    expect(config.matcher).toContain("/coach")
    expect(config.matcher).toContain("/coach/:path*")
  })
})
