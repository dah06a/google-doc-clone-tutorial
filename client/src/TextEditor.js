import React, { useCallback, useEffect, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
];

export default function TextEditor() {

    //Use state to manage socket connection and quill editor
    const { id: documentId } = useParams();
    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();

    //Initial connection and cleanup to server using socket.io
    useEffect(() => {
        const s = io('http://localhost:3001');
        setSocket(s);

        return () => {
            s.disconnect();
        }
    }, []);

    //Set document and users in the same room so only users on same document make changes to that document
    useEffect(() => {
        if (socket == null || quill == null) return;

        socket.once('load-document', document => {
            quill.setContents(document);
            quill.enable();
        });
        socket.emit('get-document', documentId);

    }, [socket, quill, documentId]);

    //Save document to MongoDB through sever every few seconds
    useEffect(() => {
        if (socket == null || quill == null) return;

        const interval = setInterval(() => {
            socket.emit('save-document', quill.getContents());
        }, SAVE_INTERVAL_MS);

        return () => {
            clearInterval(interval);
        }
    }, [socket, quill])

    //Send changes to server each time changes are made to document
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta, oldDelta, source) => {
            if (source !== 'user') return;
            socket.emit('send-changes', delta);
        }
        quill.on('text-change', handler);

        return () => {
            quill.off('text-change', handler);
        }
    }, [socket, quill]);

    //Receive changes and apply them to the document
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta) => {
            quill.updateContents(delta);
        }
        socket.on('receive-changes', handler);

        return () => {
            socket.off('receive-changes', handler);
        }
    }, [socket, quill]);

    //Wrapper used to create quill text editor ONCE on screen with desired options
    const wrapperRef = useCallback((wrapper) => {
        if (wrapper == null) return;
        wrapper.innerHTML = "";

        const editor = document.createElement('div');
        wrapper.append(editor);

        const q = new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTIONS } });
        q.disable();
        q.setText('Loading...');
        setQuill(q);
    }, []);

    return (
        <div className="container" ref={wrapperRef} />
    );
}
