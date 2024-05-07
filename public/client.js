const userVideo = document.querySelector(".user-video video");
const remoteVideo = document.querySelector(".remote-video video");

let peer;
let remoteId;

const socket = io();

socket.emit("new user", socket.id);

socket.on("ada user lain", async joinedUsers => {
    remoteId = joinedUsers.find(userId =>userId !== socket.id); 
    if(!peer){
        await createPeerConnection();
        console.log("ada user lain ");
    }
})

socket.on("offer", async ({offer, from}) => {
    remoteId = from;
    await createPeerConnection();
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(new RTCSessionDescription(answer));  
    socket.emit("answer", {answer, to: remoteId, from: socket.id});
})

socket.on("answer", async ({answer}) => {
    await peer.setRemoteDescription(new RTCSessionDescription(answer));

})

socket.on("ice candidate", async iceCandidate => {
    try {
        const candidate  = new RTCIceCandidate(iceCandidate); 
        await peer.addIceCandidate(candidate);
        console.log("sent ice candidate success");
        socket.emit("ice added")
    }catch(err){
        console.warn("Failed to add ice candidate");
    }
})

async function createPeerConnection(){                                        
    peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
            {
                urls: "turn:numb.viagenice.ca",
                username:"aradhea",
                credential: "test",
                credentialType: "password"
            }
        ]
    }); 
    
    const userStream = await  navigator.mediaDevices.getUserMedia({video: true, audio: true});
    userVideo.muted = true; 
    userVideo.srcObject = userStream;  
    userVideo.onloadedmetadata = () => {
        userVideo.play();
        userVideo.muted = true;
        
    }
    userStream.getTracks().forEach(track => peer.addTrack(track, userStream));

    peer.onicecandidate = handleIceCandidateEvent;
    peer.ontrack = handleTrackEvent; 
    peer.onnegotiationneeded = handleNegotiationNeededEvent;
}

async function handleNegotiationNeededEvent(){
        const offer = await peer.createOffer();
        socket.emit("offer", {offer, to: remoteId, from: socket.id});
        await peer.setLocalDescription(new RTCSessionDescription(offer));
}

function handleTrackEvent(e){
    const [stream] = e.streams;
    remoteVideo.muted = true;
    remoteVideo.srcObject = stream;
    remoteVideo.onloadedmetadata = () => {
        remoteVideo.play();
        // remoteVideo.muted = false;
    }
}

function handleIceCandidateEvent(e){
    if(e.candidate){
        socket.emit("ice candidate", {iceCandidate: e.candidate, to: remoteId});
    }
}