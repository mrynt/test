import React, { useEffect, useState } from 'react'
import styles from '../styles/Home.module.css'
import api from './services/api'

import { useRouter } from 'next/router'

export default function Rooms() {
  const router = useRouter()


  const [rooms, setRooms] = useState([])

  async function handleNavigateToSession(session_id) {
    router.push(`session/${session_id}`)
  }



  useEffect(() => {
    api.get('/rooms').then(({data}) => {
      if(data.data) {
        setRooms(data.data)
      }
    })
  }, [])

  useEffect(() => {
    if(!cookie.user) {
      router.push('/')
    }
  }, [cookie, router])

  return (
    <div className={styles.container}>
      <div style={{display: 'flex', flexDirection: 'row', justifyContent:'space-between'}}>
        <h1>Rooms</h1>
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
     
      {rooms.map(room => (
        <div key={room.id} 
          style={{
            border: '1px solid', 
            borderRadius: 10, 
            padding: 20,
            marginBottom: 20,
          }}
        >
            <p><strong>Room Number:</strong> {room.number}</p>
            <p><strong>Seats:</strong> {room.seats}</p>
            
            <strong>Available Sessions:</strong>

            <div style={{
              display: 'flex', 
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: 50,
            }}>
              {room.Session.map(session => (
                <div key={session.id}
                  style={{
                    border: '1px solid',
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 10,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <span>{session.id}</span>
                  <strong>{session.movie.name}</strong>

                  <div style={{marginTop: 10}}>
                  <strong>Available seats:</strong> <span>{ room.seats - session.tickets.length }</span>
                  </div>
                  <p>{session.start_time}</p>

                  <button onClick={() => handleNavigateToSession(session.id)} style={{width: '100%'}}>
                    Buy Ticket
                  </button>

                </div>
              ))}
            </div>

        </div>
      ))}
    </div>
  )
}
