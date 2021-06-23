const mongoose = require('mongoose');
const Document = require('./Document');

mongoose.connect('mongodb://localhost/google-docs-clone', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});

//Server basic setup on localhost port
const io = require('socket.io')(3001, {
    cors: {
        origin: 'http://localhost:3000',
        method: ['GET', 'POST']
    },
});

const defaultValue = "";

//When document changes, broadcast changes to all other users in same room
io.on('connection', socket => {
    socket.on('get-document', async documentId => {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId);
        socket.emit('load-document', document.data);
        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        });

        socket.on('save-document', async data => {
            await Document.findByIdAndUpdate(documentId, { data });
        });
    });
});

async function findOrCreateDocument(id) {
    if (id == null) return;

    const document = await Document.findById(id);
    if (document) return document;
    return await Document.create({ _id: id, data: defaultValue });
}
