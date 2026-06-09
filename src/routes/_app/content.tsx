import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getContentItems,
  createContentItem,
  updateContentItem,
  deleteContentItem,
} from '#/server/functions/content'
import { Button } from '#/components/ui/button'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { Modal } from '#/components/ui/modal'
import { formatDateYYYYMMDD } from '#/lib/utils'
import {
  Calendar,
  Plus,
  Search,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  BookOpen,
  FileCode,
  Sparkles,
  Trash2,
} from 'lucide-react'

export const Route = createFileRoute('/_app/content')({
  loader: async () => {
    return await getContentItems()
  },
  component: ContentCalendarPage,
})

const PLATFORM_ICONS: Record<string, any> = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  blog: BookOpen,
  other: FileCode,
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  linkedin: 'bg-blue-600/10 text-blue-300 border-blue-600/20',
  instagram: 'bg-pink-600/10 text-pink-400 border-pink-600/20',
  youtube: 'bg-red-600/10 text-red-400 border-red-600/20',
  blog: 'bg-green-600/10 text-green-400 border-green-600/20',
  other: 'bg-slate-600/10 text-slate-400 border-slate-600/20',
}

function ContentCalendarPage() {
  const contentItems = Route.useLoaderData()
  const router = useRouter()

  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState<
    'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'blog' | 'other'
  >('linkedin')
  const [status, setStatus] = useState<'idea' | 'drafting' | 'scheduled' | 'published'>('idea')
  const [content, setContent] = useState('')
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().substring(0, 10))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Month navigation helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Generate Calendar Days
  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const calendarCells = []

  // Padding cells for previous month empty days
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null)
  }

  // Current month active days
  for (let day = 1; day <= totalDays; day++) {
    calendarCells.push(day)
  }

  const handleOpenNewPost = (day?: number) => {
    setSelectedPost(null)
    setTitle('')
    setPlatform('linkedin')
    setStatus('idea')
    setContent('')
    setNotes('')

    let initialDate = new Date().toISOString().substring(0, 10)
    if (day) {
      const pad = (n: number) => n.toString().padStart(2, '0')
      initialDate = `${year}-${pad(month + 1)}-${pad(day)}`
    }
    setScheduledDate(initialDate)
    setIsFormOpen(true)
  }

  const handleOpenEditPost = (post: any) => {
    setSelectedPost(post)
    setTitle(post.title)
    setPlatform(post.platform)
    setStatus(post.status)
    setContent(post.content || '')
    setScheduledDate(formatDateYYYYMMDD(post.scheduledAt))
    setNotes(post.notes || '')
    setIsFormOpen(true)
  }

  const handleSavePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return

    setLoading(true)
    try {
      if (selectedPost) {
        await updateContentItem({
          data: {
            id: selectedPost.id,
            data: {
              title,
              platform,
              status,
              content,
              scheduledAt: scheduledDate || null,
              mediaUrls: [],
              tags: [],
              notes,
            },
          },
        })
      } else {
        await createContentItem({
          data: {
            title,
            platform,
            status,
            content,
            scheduledAt: scheduledDate || null,
            mediaUrls: [],
            tags: [],
            notes,
          },
        })
      }
      setIsFormOpen(false)
      router.invalidate()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async () => {
    if (!selectedPost) return
    setLoading(true)
    try {
      await deleteContentItem({ data: { id: selectedPost.id } })
      setIsFormOpen(false)
      router.invalidate()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Content Calendar</h1>
          <p className="text-xs text-text-2">
            Map social posts across X, LinkedIn, and blogs to organize your self-marketing.
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenNewPost()} className="flex items-center gap-1">
          <Plus size={14} /> Add Content Post
        </Button>
      </div>

      {/* MONTH NAVIGATOR HEADER */}
      <div className="flex items-center justify-between bg-surface border border-border p-4 rounded-xl">
        <h2 className="text-base font-bold text-text-1">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrevMonth}>
            Prev Month
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="secondary" size="sm" onClick={handleNextMonth}>
            Next Month
          </Button>
        </div>
      </div>

      {/* CALENDAR WEEKDAYS HEADER */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-text-3 font-bold uppercase tracking-wider">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      {/* CALENDAR CELLS GRID */}
      <div className="grid grid-cols-7 gap-2">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="bg-surface-2/10 border border-transparent rounded-xl h-28 opacity-25"
              />
            )
          }

          // Filter posts scheduled on this date
          const dayPosts = contentItems.filter((item) => {
            if (!item.scheduledAt) return false
            const dateObj =
              typeof item.scheduledAt === 'string' ? new Date(item.scheduledAt) : item.scheduledAt
            return (
              dateObj.getFullYear() === year &&
              dateObj.getMonth() === month &&
              dateObj.getDate() === day
            )
          })

          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

          return (
            <div
              key={`day-${day}`}
              onClick={() => handleOpenNewPost(day)}
              className={`bg-surface border p-2 rounded-xl h-32 flex flex-col justify-between hover:border-accent/40 hover:bg-surface-2/10 cursor-pointer group transition-all relative ${
                isToday ? 'border-accent ring-1 ring-accent' : 'border-border/80'
              }`}
            >
              <span
                className={`text-xs font-semibold ${isToday ? 'text-accent font-extrabold' : 'text-text-2'}`}
              >
                {day}
              </span>

              {/* Day scheduled items lists */}
              <div className="flex-1 overflow-y-auto space-y-1 mt-1 pb-1">
                {dayPosts.map((post) => {
                  const PlatformIcon = PLATFORM_ICONS[post.platform] || FileCode
                  return (
                    <div
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation() // prevent opening creation panel
                        handleOpenEditPost(post)
                      }}
                      className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold flex items-center gap-1 truncate ${PLATFORM_COLORS[post.platform]}`}
                    >
                      <PlatformIcon size={10} />
                      <span className="truncate">{post.title}</span>
                    </div>
                  )
                })}
              </div>

              {/* Quick Add indicator */}
              <span className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 text-[10px] text-accent transition-all">
                + Add
              </span>
            </div>
          )
        })}
      </div>

      {/* CREATE / EDIT POST MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedPost ? 'Edit Scheduled Post' : 'Add Content Post'}
        type="center"
      >
        <form onSubmit={handleSavePostSubmit} className="space-y-4">
          <Input
            label="Post Title / Working Title *"
            placeholder="e.g. 5 UI hacks for higher checkout conversions"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Platform *"
              options={[
                { value: 'twitter', label: 'Twitter / X' },
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'youtube', label: 'YouTube' },
                { value: 'blog', label: 'Blog post' },
                { value: 'other', label: 'Other/Web' },
              ]}
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              required
              disabled={loading}
            />
            <Select
              label="Workflow Status *"
              options={[
                { value: 'idea', label: 'Idea/Backlog' },
                { value: 'drafting', label: 'Drafting' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'published', label: 'Published' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              required
              disabled={loading}
            />
            <Input
              label="Scheduled Date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <Textarea
            label="Post Content / Copy"
            placeholder="Write draft content copy or post text details here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            className="min-h-[120px]"
          />

          <Textarea
            label="Internal Notes"
            placeholder="e.g. Media links, hashtags to use, distribution ideas..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            className="min-h-[60px]"
          />

          <div className="flex items-center justify-between pt-4 border-t border-border">
            {selectedPost ? (
              <Button
                type="button"
                variant="danger"
                onClick={handleDeletePost}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Post'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
