const ethers = require("ethers");
const { TwitterApi } = require('twitter-api-v2');
const { Client, GatewayIntentBits } = require('discord.js');

const dotenv = require('dotenv');
dotenv.config();

const abi_gnosis = require("./gnosis_safe_abi.json")

const token = process.env.DISCORD_TOKEN

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
discordClient.once('ready', () => {
    console.log('Ready!');
});

// Login to Discord with your client's token
discordClient.login(token);


//  Twitter bot keys
const client = new TwitterApi({
    appKey: process.env.APPKEY,   //'consumerAppKey',
    appSecret: process.env.APPSECRET, //'consumerAppSecret',
    accessToken: process.env.ACCESSTOKEN, //'accessOAuthToken',
    accessSecret: process.env.ACCESSSECRET //'accessOAuthSecret',
});

async function main () {

    const cat_dao_gnosis_safe = "0x0B241210900Aeac2fb445345366D605355fe2490"

    const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161");
    //const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
    
    // Mainnet cat dao contract
    const contract = new ethers.Contract(cat_dao_gnosis_safe, abi_gnosis, provider)

    async function sendTwitterDM(sender, amount) {

        //tweeterid.com  to get the twitterID
        const bob = '1063177866890921'
        const alice = '1284668218745914'
        
        const recipients = [bob, alice]

        for (x=0; x < recipients.length; x++) {
            const dmSent = await client.v1.sendDm({
                recipient_id: recipients[x],  
                text: `Transfer of ${amount} ETH received from ${sender}`,
                //attachment: { type: 'media', media: { id: imgMediaId } },
            });
            console.log("dmSent: ", dmSent)
        }
    }

    async function sendDiscordDM(sender, amount) {
        
        const bob  = await discordClient.users.fetch("6158927542037236").catch(() => null);
        const alice  = await discordClient.users.fetch("615892754269037236").catch(() => null);

        const msg = await bob.send(`Transfer of ${amount} ETH received from ${sender}`).catch(() => {
            console.log("Message to Bob failed")
        });
        //console.log("msg: ", msg)
        const msg2 = await alice.send(`Transfer of ${amount} ETH received from ${sender}`).catch(() => {
            console.log("Message to Alice failed")
        });

    }

    contract.on("SafeReceived", (sender, value, event) => {
        let info = {
            sender: sender,
            value: value,
            data: event,

        }
        console.log(JSON.stringify(info, null, 4))
        const sender = info.sender;
        const value1 = ethers.utils.formatEther(info.value);
        //console.log("info.sender: ", info.sender)
        //console.log("info.value: ", ethers.utils.formatEther(info.value))

        sendDiscordDM(sender, value1);
        sendTwitterDM(sender, value1);
    })
}
main();
