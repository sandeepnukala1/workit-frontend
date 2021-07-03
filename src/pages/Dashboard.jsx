import React from "react"
import { Link } from "react-router-dom"
import {useAppState} from "../AppState.jsx"
import {Route} from "react-router-dom"
import Form from '../components/Form'
import styled from 'styled-components'
import {useRef} from 'react'
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";

const Container = styled.div`
    display: flex;
`
const COLUMN_NAMES = {
    DO_IT: 'Do it',
    IN_PROGRESS: 'In Progress',
    AWAITING_REVIEW: 'Awaiting review',
    DONE: 'Done',
}

const dndTasks = [
    {id: 1, name: 'Item 1', status: 'In Progress'},
    {id: 2, name: 'Item 2', status: 'In Progress'},
    {id: 3, name: 'Item 3', status: 'In Progress'},
    {id: 4, name: 'Item 4', status: 'In Progress'},
];

const MovableItem = ({name, index, currentColumnName, moveCardHandler, setItems, globalState, dispatch, props, getTasks, itemState, tokenObj}) => {
    const changeItemColumn = (currentItem, columnName) => {
        setItems((prevState) => {
            return prevState.map(e => {
                return {
                    ...e,
                    status: e.name === currentItem.name ? columnName : e.status,
                }
            })
        });
        console.log(itemState)
        let foundTask = globalState.tasks.find(task => task.title === name)
        let updatedTask = {...foundTask, status: columnName}
        fetch(globalState.url + "/tasks/" + foundTask.id ,{
            method: "put",
            headers: {
                "Content-Type": "application/json",
                Authorization: "bearer " + tokenObj.token
            },
            body: JSON.stringify(updatedTask)
        }).then(() => getTasks())
    }

    const ref = useRef(null);

    const [, drop] = useDrop({
        accept: 'Our first type',
        hover(item, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            // Determine mouse position
            const clientOffset = monitor.getClientOffset();
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }
            // Time to actually perform the action
            moveCardHandler(dragIndex, hoverIndex);
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
        },
    });

    const [{isDragging}, drag] = useDrag({
        item: {index, name, currentColumnName}, type: 'Our first type',
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult();

            if (dropResult) {
                const {name} = dropResult;
                const {DO_IT, IN_PROGRESS, AWAITING_REVIEW, DONE} = COLUMN_NAMES;
                switch (name) {
                    case IN_PROGRESS:
                        changeItemColumn(item, IN_PROGRESS);
                        break;
                    case AWAITING_REVIEW:
                        changeItemColumn(item, AWAITING_REVIEW);
                        break;
                    case DONE:
                        changeItemColumn(item, DONE);
                        break;
                    case DO_IT:
                        changeItemColumn(item, DO_IT);
                        break;
                    default:
                        break;
                }
            }
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });
    const opacity = isDragging ? 0.4 : 1;

    drag(drop(ref));

    console.log(globalState, index)

    let foundTask = globalState.tasks.find(task => task.title === name)
    
    return (
        <div>
        <div ref={ref} className='movable-item' style={{opacity}}>
            <div>{name}</div>
        </div>
        <div>
            <button onClick={()=> {
                    dispatch({type: "select", payload: foundTask})
                    props.history.push("/dashboard/editTask")
                }}>Edit Task</button>
                <button onClick={()=> {
                    fetch(globalState.url + "/tasks/" + foundTask.id ,{
                        method: "delete",
                        headers: {
                            Authorization: "bearer " + globalState.token
                        }
                    }).then(() => getTasks())
                }}>Delete Task</button>
        </div>
        </div>
    )
}

const Column = ({children, className, title}) => {
    const [{isOver, canDrop}, drop] = useDrop({
        accept: 'Our first type',
        drop: () => ({name: title}),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
        // Override monitor.canDrop() function
        canDrop: (item) => {
            const {DO_IT, IN_PROGRESS, AWAITING_REVIEW, DONE} = COLUMN_NAMES;
            const {currentColumnName} = item;
            return (currentColumnName === title) ||
                (currentColumnName === DO_IT && title === IN_PROGRESS) ||
                (currentColumnName === IN_PROGRESS && (title === DO_IT || title === AWAITING_REVIEW)) ||
                (currentColumnName === AWAITING_REVIEW && (title === IN_PROGRESS || title === DONE)) ||
                (currentColumnName === DONE && (title === AWAITING_REVIEW));
        },
    });

    const getBackgroundColor = () => {
        if (isOver) {
            if (canDrop) {
                return 'rgb(188,251,255)'
            } else if (!canDrop) {
                return 'rgb(255,188,188)'
            }
        } else {
            return '';
        }
    };

    return (
        <div ref={drop} className={className} style={{backgroundColor: getBackgroundColor()}}>
            <p>{title}</p>
            {children}
        </div>
    )
}

const Dashboard = (props) => {

    const {state, dispatch} = useAppState()
    const {token, url, tasks, username, statuses} = state
    const [isFirstColumn, setFirstColumn] = React.useState(true)
    const Item = <MovableItem setFirstColumn={setFirstColumn}/>
    let tokensss = localStorage.getItem('auth')
    let parsedobj = JSON.parse(tokensss)
    const [items, setItems] = React.useState([]);

    const getTasks = async () => {
        
        const response = await fetch(url +"/tasks/", {
            method: "get",
            headers: {
              Authorization: "bearer " + parsedobj.token
            }
        })
        const fetchedTasks = await response.json()
        dispatch({type: "getTasks", payload: fetchedTasks})
        let loadedTasks = fetchedTasks.map(task => {
            return {
                id: task.id,
                name: task.title,
                status: task.status
            }
        })
        setItems(loadedTasks)
    }

    const getStatuses = async () => {
        
        const response = await fetch(url +"/statuses/", {
            method: "get",
            headers: {
              Authorization: "bearer " + parsedobj.token
            }
        })
        const fetchedStatuses = await response.json()
        dispatch({type: "getStatuses", payload: fetchedStatuses})
        
    }

    React.useEffect(() => {
        // if(state.token) {
            getTasks()
            getStatuses()
        // }
    }, [])

    
    const isMobile = window.innerWidth < 600;

    const moveCardHandler = (dragIndex, hoverIndex) => {
        const dragItem = items[dragIndex];

        if (dragItem) {
            setItems((prevState => {
                const coppiedStateArray = [...prevState];

                // remove item by "hoverIndex" and put "dragItem" instead
                const prevItem = coppiedStateArray.splice(hoverIndex, 1, dragItem);

                // remove item by "dragIndex" and put "prevItem" instead
                coppiedStateArray.splice(dragIndex, 1, prevItem[0]);

                return coppiedStateArray;
            }));
        }
    };

    const returnItemsForColumn = (columnName) => {
        return items
            .filter((item) => item.status === columnName)
            .map((item, index) => (
                <MovableItem key={item.id}
                             name={item.name}
                             currentColumnName={item.status}
                             setItems={setItems}
                             index={index}
                             globalState={state}
                             dispatch={dispatch}
                             props={props}
                             getTasks={getTasks}
                             itemState={items}
                             tokenObj={parsedobj}
                             moveCardHandler={moveCardHandler}
                />
            ))
    }

    const {DO_IT, IN_PROGRESS, AWAITING_REVIEW, DONE} = COLUMN_NAMES;

    const loaded = () => {
        
        return (
        <>
        <div>
        <h1>{username}'s tasks for your current Project</h1>
        <Link to="/dashboard/newTask"><button>Create New Task</button></Link>
        {/* <Link to="/dashboard/newStatus"><button>Create New Status</button></Link> */}
        <Route path="/dashboard/:action" render={(rp) => <Form {...rp} getTasks={getTasks} getStatuses={getStatuses}/>} />
        </div>
            
            <div className="container">
            <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
                <Column title={DO_IT} className='column do-it-column'>
                    {returnItemsForColumn(DO_IT)}
                </Column>
                <Column title={IN_PROGRESS} className='column in-progress-column'>
                    {returnItemsForColumn(IN_PROGRESS)}
                </Column>
                <Column title={AWAITING_REVIEW} className='column awaiting-review-column'>
                    {returnItemsForColumn(AWAITING_REVIEW)}
                </Column>
                <Column title={DONE} className='column done-column'>
                    {returnItemsForColumn(DONE)}
                </Column>
            </DndProvider>
            </div>
          
        </>
        )
    }

    return tasks ? loaded() : <h1>Loading...</h1>
}

export default Dashboard;