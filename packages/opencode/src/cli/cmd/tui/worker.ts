import { Installation } from "@/installation"
import { Server } from "@/server/server"
import { Log } from "@/util/log"
import { Instance } from "@/project/instance"
import { Rpc } from "@/util/rpc"

await Log.init({
  print: process.argv.includes("--print-logs"),
  dev: Installation.isDev(),
  level: (() => {
    if (Installation.isDev()) return "DEBUG"
    return "INFO"
  })(),
})

const server = Server.listen({
  port: 0,
  hostname: "127.0.0.1",
})

process.on("unhandledRejection", (e) => {
  Log.Default.error("rejection", {
    e: e instanceof Error ? e.message : e,
  })
})

process.on("uncaughtException", (e) => {
  Log.Default.error("exception", {
    e: e instanceof Error ? e.message : e,
  })
})

export const rpc = {
  server() {
    return {
      url: server.url.toString(),
    }
  },
  async shutdown() {
    await Instance.disposeAll()
    await server.stop(true)
  },
}

Rpc.listen(rpc)
