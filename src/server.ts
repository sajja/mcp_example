import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";

const server = new McpServer({
    name: "mcp-example1",
    version: "1.0.0",
    capabilities: {
        resources:{},
        tools:{},
        prompts:{},
        commands: {}
    }
})

function createUser({name, email}: {name: string, email: string}){
    // Simulate user creation and return a user ID
    return Math.floor(Math.random() * 10000);
}

server.tool("Create-User", "Creates a new user in the database", {
    name: z.string().describe("The name of the user to create"),
    email: z.string().email().describe("The email of the user to create")
},{
    title: "Create User",
    readOnlyHint:  false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
}, async (p)=>{
    try {
        const id = createUser(p)
        return {
            content: [{
                type: "text",
                text: `User created with id ${id}`
            }]
        }
    }catch {
        return {
            content: [{
                type: "text",
                text: "Failed to create user"
            }]
        }
    }
})

async function main(){
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.log("MCP server is running...")
}

main()