"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, Send, X, Music, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

export default function SubmitMilestonePage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files
    if (newFiles) {
      // Append new files to existing files
      setFiles(prevFiles => [...prevFiles, ...Array.from(newFiles)])
      // Reset input so same file can be selected again
      e.target.value = ""
    }
  }

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const getFileType = (file: File): string => {
    if (file.type.startsWith("image/")) return "Image"
    if (file.type.startsWith("audio/")) return "Audio"
    return "File"
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    }
    if (file.type.startsWith("audio/")) {
      return <Music className="h-4 w-4 text-purple-500" />
    }
    return <Upload className="h-4 w-4 text-gray-500" />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (files.length === 0) {
      alert("Please select at least one file")
      return
    }

    setIsSubmitting(true)

    try {
      // Mock milestone ID - in real app this would come from route params
      const milestoneId = "m2"
      
      // Log submission data for now (in production would use hook)
      console.log("Submitting milestone:", {
        milestoneId,
        files: files.map(f => ({ name: f.name, type: f.type, size: f.size })),
        notes,
        timestamp: new Date().toISOString()
      })

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Show success and redirect
      alert("Milestone submitted successfully! AI verification in progress...")
      router.push("/dashboard/worker")
    } catch (error) {
      console.error("Failed to submit milestone:", error)
      alert("Failed to submit milestone. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/worker">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Submit Milestone</h1>
          <p className="text-muted-foreground">Upload proof of work and submit for verification</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Milestone Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="proof">Proof of Work * (Multiple files supported)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="proof"
                  type="file"
                  multiple
                  accept="image/*,audio/*,.mp3,.wav,.m4a"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Accepted formats: PNG, JPG, JPEG, WebP images and MP3, WAV, M4A audio files
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Selected Files ({files.length})</p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-background rounded border border-muted"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getFileType(file)} • {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="ml-2 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Describe what you've completed, any challenges faced, or additional context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={files.length === 0 || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Milestone
                  </>
                )}
              </Button>
              <Link href="/dashboard/worker">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}