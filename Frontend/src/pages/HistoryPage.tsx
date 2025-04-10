import{ useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import "../styles/HomePage.css"

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
  participants: string[];
  status: string;
  createdAt: string;
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)
  
  // Fetch meeting history when component mounts
  useEffect(() => {
    fetchMeetingHistory(1)
  },[])
  
  // Handle clicking outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-picture') && !target.closest('.profile-content')) {
        setShowProfile(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  // Add this function to de-duplicate and process meetings
  const processMeetings = (meetings: Meeting[]) => {
    const uniqueMeetings = new Map();
    
    meetings.forEach(meeting => {
      const existingMeeting = uniqueMeetings.get(meeting._id);
      
      if (existingMeeting) {
        if (meeting.status === 'completed' && existingMeeting.status === 'ongoing') {
          uniqueMeetings.set(meeting._id, meeting);
        }
      } else {
        uniqueMeetings.set(meeting._id, meeting);
      }
    });
    
    return Array.from(uniqueMeetings.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  };

  const fetchMeetingHistory = async (currentPage: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        navigate('/')
        return
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/users/history`,
        {
          params: {
            page: currentPage,
            limit: pageSize,
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      if (response.data.success) {
        const newMeetings = response.data.data;
        
        const processedMeetings = processMeetings(
          currentPage === 1 ? newMeetings : [...meetings, ...newMeetings]
        );
        
        setMeetings(processedMeetings);
        
        if (response.data.pagination) {
          setHasMore(response.data.pagination.hasMore);
        } else {
          setHasMore(newMeetings.length === pageSize);
        }
      } else {
        setError('Failed to fetch meeting history')
      }
    } catch (error) {
      console.error('Error fetching meeting history:', error)
      setError('An error occurred while fetching your meeting history')
    } finally {
      setLoading(false)
    }
  }

  // Load more meetings when scrolling to bottom
  const loadMoreMeetings = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMeetingHistory(nextPage);
    }
  }

  // Setup intersection observer for infinite scrolling
  const lastMeetingRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMeetings();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        navigate('/')
        return
      }
  
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/logout`, 
        {}, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
  
      if (response.status === 200) {
        localStorage.clear()
        navigate('/')
      }
    } catch (err) {
      console.error("Logout error:", err)
      localStorage.clear()
      navigate('/')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const joinMeeting = (meetingLink: string) => {
    try {
      const url = new URL(meetingLink);
      const pathParts = url.pathname.split('/');
      const meetingId = pathParts[pathParts.length - 1];
      
      navigate(`/meeting/${meetingId}`);
    } catch (error) {
      const meetingId = meetingLink.split('/').pop() || meetingLink;
      navigate(`/meeting/${meetingId}`);
    }
  }

  const goToHomePage = () => {
    navigate('/home')
  }

  return (
    <div className="min-h-screen">
      <div className="nav-bar px-4 py-3 sm:py-4 flex justify-between items-center">
        <div className="nav-bar-left-content">
          <h2 className='cursor-pointer text-xl font-medium' onClick={goToHomePage}>VideoMeet</h2>
        </div>
        <div className="nav-bar-right-content text-base sm:text-lg font-normal hidden sm:flex items-center gap-4">
          <h2 className="whitespace-nowrap">
            {new Date().toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })} · {new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric'
            })} · {new Date().toLocaleString('en-US', {
              weekday: 'long'
            })}
          </h2>
          <i className="fa-solid fa-gear cursor-pointer"></i>
          <div className="profile-picture" onClick={() => setShowProfile(!showProfile)}>
            <h2>A</h2>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <div className="sm:hidden flex items-center gap-2">
          <i className="fa-solid fa-gear cursor-pointer mx-3"></i>
          <div className="profile-picture" onClick={() => setShowProfile(!showProfile)}>
            <h2>A</h2>
          </div>
        </div>
      </div>

      {showProfile && (
        <div className="profile-content h-40 w-64 border border-amber-900 bg-background absolute top-16 right-4 sm:right-25 rounded-lg z-10 flex flex-col p-2 shadow-lg">
          <div className="manage-customization flex items-center gap-4 p-2.5 text-lg cursor-pointer hover:bg-gray-100 rounded">
            <i className="fa-solid fa-pencil"></i>
            <h2>Customize profile</h2>
          </div>
          <div className="manage-another-profile flex items-center gap-4 p-2.5 text-lg cursor-pointer hover:bg-gray-100 rounded">
            <i className="fa-solid fa-user-plus"></i>
            <h2>Add another account</h2>
          </div>
          <div className="manage-logout flex items-center gap-4 p-2.5 text-lg cursor-pointer hover:bg-gray-100 rounded" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <h2>Logout</h2>
          </div>
        </div>
      )}

      <div className="history-container max-w-6xl mx-auto mt-4 sm:mt-8 p-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Meeting History</h1>
        
        {loading && page === 1 && <p className="text-center py-4">Loading your meeting history...</p>}
        
        {error && <p className="text-red-500 text-center py-4">{error}</p>}
        
        {!loading && !error && meetings.length === 0 && 
          <p className="text-center py-8">You have no meeting history yet.</p>
        }

        {!loading && !error && meetings.length > 0 && (
          <div className="meetings-list-container" style={{ 
            maxHeight: "calc(100vh - 200px)", 
            overflowY: "auto",
            msOverflowStyle: "none",
            scrollbarWidth: "none"
          }}>
            <style>
              {`
                .meetings-list-container::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            <div className="meetings-list">
              {/* Desktop header */}
              <div className="hidden sm:grid grid-cols-5 font-bold mb-2 p-3 bg-gray-100 rounded sticky top-0">
                <div>Title</div>
                <div>Date & Time</div>
                <div>Duration</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              
              {meetings.map((meeting, index) => {
                const startTime = new Date(meeting.startTime);
                const endTime = meeting.status === 'completed' ? new Date(meeting.endTime) : new Date();
                let durationMinutes = 0;
                
                // Calculate duration
                if (meeting.status === 'completed') {
                  const durationMs = endTime.getTime() - startTime.getTime();
                  durationMinutes = Math.max(0, Math.round(durationMs / (1000 * 60)));
                } else if (meeting.status === 'ongoing') {
                  const durationMs = Date.now() - startTime.getTime();
                  durationMinutes = Math.max(0, Math.round(durationMs / (1000 * 60)));
                } else {
                  const durationMs = new Date(meeting.endTime).getTime() - startTime.getTime();
                  durationMinutes = Math.max(0, Math.round(durationMs / (1000 * 60)));
                }
                
                // Add a ref to the last item for infinite scrolling
                const isLastItem = index === meetings.length - 1;
                
                return (
                  <div 
                    key={meeting._id} 
                    ref={isLastItem ? lastMeetingRef : null}
                    className="border-b hover:bg-gray-50"
                  >
                    {/* Desktop view */}
                    <div className="hidden sm:grid sm:grid-cols-5 p-3">
                      <div>
                        <p className="font-medium">{meeting.title}</p>
                        {meeting.description && <p className="text-sm text-gray-600">{meeting.description}</p>}
                      </div>
                      <div>{formatDate(meeting.startTime)}</div>
                      <div>{durationMinutes} minutes</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                          meeting.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                          meeting.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {meeting.status === 'scheduled' && (
                          <button 
                            onClick={() => joinMeeting(meeting.meetingLink)}
                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                          >
                            Join
                          </button>
                        )}
                        {meeting.status === 'completed' && (
                          <button className="text-gray-700 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm">
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Mobile view */}
                    <div className="sm:hidden p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{meeting.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                          meeting.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                          meeting.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>
                      
                      {meeting.description && 
                        <p className="text-sm text-gray-600">{meeting.description}</p>
                      }
                      
                      <div className="text-sm text-gray-600">
                        {formatDate(meeting.startTime)}
                      </div>
                      
                      <div className="text-sm">
                        Duration: {durationMinutes} minutes
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        {meeting.status === 'scheduled' && (
                          <button 
                            onClick={() => joinMeeting(meeting.meetingLink)}
                            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm flex-1"
                          >
                            Join Meeting
                          </button>
                        )}
                        {meeting.status === 'completed' && (
                          <button className="text-gray-700 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm flex-1">
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading indicator at the bottom */}
              {loading && page > 1 && (
                <div className="text-center py-4">
                  <p>Loading more meetings...</p>
                </div>
              )}
              
              {/* End of list indicator */}
              {!loading && !hasMore && meetings.length > 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>No more meetings to load</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
