import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
import fs from "fs/promises";
import path from "path";

const dbPath = path.join(process.cwd(), "db.json");

type User = {
    id: number;
    name: string;
    email: string;
};

type Db = {
    users: User[];
};

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

server.prompt("create-random-starwars-user", "Create random star wars user", {}, ()=>{
    return {
        messages:[{
            role: "user",
            content: {
                type: "text", text:"Create a random star wars user with a name and email"        
            }
        }]

    }
})

server.resource("users", "user://all",{
    description: "get all users",
    title:"users",
    mimeType: "application/json",
},
async url=>{
    const db: Db = JSON.parse(await fs.readFile(dbPath, "utf-8"));
    return {
        contents: [{uri:url.href,text:JSON.stringify(db.users, null, 2), mimeType:"application/json"}],
    }
})

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
        const id = await createUser(p)
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

async function createUser({name, email}: {name: string, email: string}){
    const db: Db = JSON.parse(await fs.readFile(dbPath, "utf-8"));
    const newUser: User = {
        id: db.users.length + 1,
        name,
        email,
    };
    db.users.push(newUser);
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return newUser.id;
}


async function main(){
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.log("MCP server is running...")
}

main()