import path from 'path'
import fs, {type Stats} from 'fs'
import {EventEmitter} from 'events'

type DirectoryFilter = (entry: string, stat: Stats) => boolean
class Walker extends EventEmitter {
  _pending = 0
  _filterDir: DirectoryFilter = function () {return true}

  constructor(root: string) {
    super()
    this.go(root)
  }

  go (entry: string) {
    this._pending++

    fs.lstat(entry, (er, stat) => {
      if (er) {
        this.emit('error', er, entry, stat)
        this.doneOne()
        return
      }

      if (stat.isDirectory()) {
        if (!this._filterDir(entry, stat)) {
          this.doneOne()
        } else {
          fs.readdir(entry, (er, files) => {
            if (er) {
              this.emit('error', er, entry, stat)
              this.doneOne()
              return
            }

            this.emit('entry', entry, stat)
            this.emit('dir', entry, stat)
            files.forEach((part) => {
              this.go(path.join(entry, part))
            })
            this.doneOne()
          })
        }
      } else if (stat.isSymbolicLink()) {
        this.emit('entry', entry, stat)
        this.emit('symlink', entry, stat)
        this.doneOne()
      } else if (stat.isBlockDevice()) {
        this.emit('entry', entry, stat)
        this.emit('blockDevice', entry, stat)
        this.doneOne()
      } else if (stat.isCharacterDevice()) {
        this.emit('entry', entry, stat)
        this.emit('characterDevice', entry, stat)
        this.doneOne()
      } else if (stat.isFIFO()) {
        this.emit('entry', entry, stat)
        this.emit('fifo', entry, stat)
        this.doneOne()
      } else if (stat.isSocket()) {
        this.emit('entry', entry, stat)
        this.emit('socket', entry, stat)
        this.doneOne()
      } else if (stat.isFile()) {
        this.emit('entry', entry, stat)
        this.emit('file', entry, stat)
        this.doneOne()
      } else {
        this.emit('error', UnknownFileTypeError(), entry, stat)
        this.doneOne()
      }
    })
    return this
  }
  filterDir (fn: DirectoryFilter) {
    this._filterDir = fn
    return this
  }

  doneOne () {
    if (--this._pending === 0) {
      this.emit('end')
    }
    return this
  }
}

export default Walker

export function UnknownFileTypeError () {
  const error = new Error('UnknownFileTypeError')
  error.message = 'The type of this file could not be determined.'
  return error
}