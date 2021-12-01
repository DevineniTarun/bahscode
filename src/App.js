import React, { useState, useEffect } from 'react';
import './App.css';
import { API } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import { Storage } from 'aws-amplify';


const initialFormState = { name: '', description: '' }

function App() {
    const [notes, setNotes] = useState([]);
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchNotes();
    }, []);
    async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    await fetchNotes();
  }

  return (
    <div className="App">
      <nav class='hdr'>
        <img class='g_img' src='https://ssl.gstatic.com/images/branding/product/2x/hh_drive_96dp.png' alt='image' height='100px' width='100px'/>
      <h1 class='font' >Personal Drive</h1>
      </nav>
      <input class='image_name'
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Image Name"
        value={formData.name}
      />
      <input class='image_desc'
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Image Description"
        value={formData.description}
      />
      <input class='file_cls'
        type="file"
        onChange={onChange}
      />
      <button class='upload_img' onClick={createNote}>Upload Image</button>
      <div class = 'u_img' style={{marginBottom: 550}}>
      {
      notes.map(note => (
      <div class='t_img' key={note.id || note.name}>
      <h2>{note.name}</h2>
      <p>{note.description}</p>
      {
        note.image && <img class='imag' src={note.image}  />
      }
       <button onClick={() => deleteNote(note)}>Delete image</button>
      </div>
      ))
      }
      </div>
      <div class='sign_out'>
      <AmplifySignOut />
      </div>
    </div>
  );
}

export default withAuthenticator(App);