import path from "path"
import fs from "fs/promises"
import { Global } from "@/global"

export namespace ToolResult {
  const RESULTS_DIR = "tool-results"

  /**
   * Get the tool results directory for a session
   */
  async function getResultsDir(sessionID: string): Promise<string> {
    const resultsDir = path.join(Global.Path.data, RESULTS_DIR, sessionID)
    await fs.mkdir(resultsDir, { recursive: true })
    return resultsDir
  }

  /**
   * Persist a large tool result to disk
   * Returns the absolute path to the saved file
   */
  export async function persist(input: {
    sessionID: string
    tool: string
    callID: string
    content: string
    mimeType?: string
  }): Promise<string> {
    const dir = await getResultsDir(input.sessionID)
    const ext = input.mimeType?.includes("json") ? "json" : "txt"
    const filename = `${input.tool}-${input.callID}.${ext}`
    const filepath = path.join(dir, filename)

    await fs.writeFile(filepath, input.content, "utf-8")
    return filepath
  }

  /**
   * Format the reference message for the model
   */
  export function formatReference(input: {
    filepath: string
    charCount: number
    tool: string
    isJson?: boolean
  }): string {
    const lines = [
      `Output (${input.charCount.toLocaleString()} characters) exceeds context limit.`,
      `Full output saved to: ${input.filepath}`,
      ``,
      `To explore this output:`,
      `- Use Read tool with offset/limit parameters to view portions`,
      `- Use Grep tool to search for specific content`,
    ]

    if (input.isJson) {
      lines.push(`- Use Bash with jq for structured queries (e.g., jq '.items[0]' "${input.filepath}")`)
    }

    return lines.join("\n")
  }
}
