import React from 'react'
import {useAppState} from '../AppState'

const Form = (props) => {
    const {state, dispatch} = useAppState()
    const {token} = state
    const action = props.match.params.action
    
    const [formData, setFormData] = React.useState(state[action])
    let tokensss = localStorage.getItem('auth')
    let parsedobj = JSON.parse(tokensss)


    const actions = {
        newTask: () => {
          return fetch(state.url + "/tasks", {
              method: "post",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: "bearer " + parsedobj.token
              },
              body: JSON.stringify(formData)
          }).then(response => response.json())
        },
        editTask: () => {
          return fetch(state.url + "/tasks/" + state.editTask.id, {
              method: "put",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: "bearer " + parsedobj.token
              },
              body: JSON.stringify(formData)
          }).then(response => response.json())
        },
        newStatus: () => {
          return fetch(state.url + "/statuses", {
              method: "post",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: "bearer " + parsedobj.token
              },
              body: JSON.stringify(formData)
          }).then(response => response.json())
        },
        editStatus: () => {
          return fetch(state.url + "/statuses/" + state.edit.id, {
              method: "put",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: "bearer " + parsedobj.token
              },
              body: JSON.stringify(formData)
          }).then(response => response.json())
        }
      }

    const handleChange = (event) => {
        setFormData({...formData, [event.target.name] : event.target.value})
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        actions[action]().then((data) => {
            props.getTasks()
            props.getStatuses()
            props.history.push("/dashboard")
        });
    }

    return action.includes("Task") ?
         <div className="form">
            <form onSubmit={handleSubmit}>
            <label>Title:</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange}/>
            <label>Description:</label>
            <input type="text" name="description" value={formData.description} onChange={handleChange}/>
            <label>Status:</label>
            <input type="text" name="status" value={formData.status} onChange={handleChange}/>
            <input type="submit" value={action}/>
            </form> 
         </div> :
         <div className="form">
            <form onSubmit={handleSubmit}>
                <input type="text" name="title" value={formData.title} onChange={handleChange}/>
                <input type="submit" value={action}/>
            </form>
         </div>
}

export default Form;