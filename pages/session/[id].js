import React, { useEffect, useState } from 'react'
import { useCookies } from "react-cookie"
import { useRouter,  } from 'next/router'
import api from '../services/api'
import styles from '../../styles/Home.module.css'
import io from 'socket.io-client'

function useSocket(url) {
  const [socket, setSocket] = useState(null)
   const router = useRouter()
  const { id: session_id } = router.query

  useEffect(() => {
    console.log(session_id)
    //if(!cookie.user) return
    if(!session_id) return
    
    const socketIo = io(url)

    setSocket(socketIo)

    socketIo.emit('add-to-main-room', { user_id: (Math.random() + 1).toString(36).substring(7), session_id })

    // return () => {
    //     socketIo.disconnect()
    // }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ session_id])

  return socket
}

export default function Session() {
    const router = useRouter()
    const { id: session_id } = router.query

    
    const socket = useSocket(`http://54.169.80.122:4000`)
    
    const [session, setSession] = useState()

    const [virtualRoom, setVirtualRoom] = useState({
        main: false,
        waitingRoom: false,
        queuePosition: 0,
        error: null,
        loading: true,
        ticket: null
    })
    
    async function handleBuyTicket() {
        if(!socket) return
        if(!session_id) return

        socket.emit('buy-ticket', {
            buyer_id: cookie.user.user.id,
            session_id
        })
    }

    useEffect(() => {
        if(session_id) {
            api.get(`/rooms/movie/${session_id}`).then(({data}) => {
                if(data.session) {
                    setSession(data.session)
                }
            })
        }
    }, [session_id])

    useEffect(() => {
      
    }, [router])

    useEffect(() => {
        if(!socket) return
        
        if(!session_id) return
        
        const { id: user_id } = (Math.random() + 1).toString(36).substring(7)
        
        console.log(socket)
        socket.on('add-to-main-room', ({success, ticket, data, error}) => {
            console.log('yoooo', {success, ticket, data, error})
            if(success) {
                if(ticket) {
                    setVirtualRoom({
                        main: true,
                        waitingRoom: false,
                        queuePosition: 0,
                        loading: false,
                        ticket
                    })
                    return
                }
                
                if (data.isWaitingRoom) {
                    setVirtualRoom({
                        main: false,
                        waitingRoom: true,
                        queuePosition: data.queuePosition,
                        loading: false,
                        ticket: data.ticket
                    })
                    return
                }
                
            } else {
                console.log({data, error, ticket})
                setVirtualRoom((prev) => ({
                    ...prev,
                    main: false,
                    waitingRoom: false,
                    queuePosition: 0,
                    error: error,
                    loading: false,
                    ticket
                }))
            }
        })
        
        socket.on('buy-ticket', ({success, data}) => {
            if(success) {
                console.log({data})
                
                // alert('Bought successfully')
                router.push('/rooms')
            }
        })
                
        socket.on(`update-room:${session_id}`, ({whoLeft, success, nextTicket, mainRoom, newWaitingRoom}) => {
            if(virtualRoom.loading) return

            console.log({whoLeft, success, nextTicket, virtualRoom, mainRoom, newWaitingRoom});
            if(mainRoom) {
                console.log('maiin')
                if(success && whoLeft && virtualRoom.ticket !== whoLeft) {
                    if(nextTicket == virtualRoom.ticket) {
                        setVirtualRoom((prev) => ({
                            ...prev,
                            main: true,
                            waitingRoom: false,
                            queuePosition: 0,
                            loading: false,
                        }))
                    } else {
                        setVirtualRoom((prev) => ({
                            ...prev,
                            main: false,
                            waitingRoom: true,
                            queuePosition: virtualRoom.queuePosition - 1,
                            loading: false,
                        }))
                    }
                }
                return
            } 
            
            if (!virtualRoom.main) {
                if(success && whoLeft && virtualRoom.ticket !== whoLeft) {
                    if(whoLeft != virtualRoom.ticket) {
                        setVirtualRoom((prev) => ({
                            ...prev,
                            main: false,
                            waitingRoom: true,
                            queuePosition: newWaitingRoom.length == 0 ? 1 : newWaitingRoom.findIndex((t) => t == virtualRoom.ticket) + 1,
                            loading: false,
                        }))
                    }
                }
                return
            }
        })
        
        socket.on('disconnect', () => {
            console.log('disconnected')
        })
                
        router.beforePopState(() => {
            if(virtualRoom.main) {
                console.log(`remove main => ${user_id} => ${session_id}`)
                socket.emit('remove-from-main-room', { user_id, session_id })
                socket.disconnect()
                return true
            } 
            
            if(virtualRoom.waitingRoom) {
                console.log('remove from waiting')
                
                socket.emit('remove-from-waiting-room', { user_id, session_id })
                socket.disconnect()
                return true
            }
            
            return true
        })
                
    }, [
        // cookie?.user?.user, 
        // session_id, 
        socket, 
        virtualRoom, 
    ])
    
    console.log({virtualRoom})

    if(!session) return <></>
    
    return (
        <div className={styles.container}>
        <h1>Session</h1>

        <div>
            <p><strong>Movie:</strong> {session.movie.name}</p>
            <p><strong>Room Number:</strong> {session.room.number}</p>
            <p><strong>Seats:</strong> {session.room.seats}</p>
            <p><strong>Date:</strong> {session.start_time}</p>

            <p><strong>Seats Remaining:</strong> {session.room.seats - session.tickets.length}</p>

            
        </div>

        {virtualRoom.loading ? (
            <p>Loading...</p>
        ) : virtualRoom.main ? (
            <button onClick={handleBuyTicket}>Buy</button>
        ) : virtualRoom.waitingRoom ? (
            <p>You are in the waiting room. Your position is {virtualRoom.queuePosition}</p>
        ) : virtualRoom.error ? (
            <span>{virtualRoom.error}</span>
        ) : (
            <button onClick={() => {
                socket.emit('add-to-main-room', { user_id: cookie.user.user.id, session_id })
            }}>Refresh</button>
        )}
            

    </div>
  )
}
