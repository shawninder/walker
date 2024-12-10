import Walker from '../src/walker'
import fs from 'fs'

import {beforeAll, describe, expect, test} from '@jest/globals'

const SIMPLE_WALK = __dirname + '/fixture-simple-walk'
const ERROR_WALK = __dirname + '/fixture-error-walk'
const BAD_START_WALK = __dirname + '/fixture-error-walk/d'
const SYMLINK_WALK = __dirname + '/fixture-symlink-walk'

beforeAll(() => {
  try {
    fs.chmodSync(BAD_START_WALK, 0o600)
    fs.rmdirSync(BAD_START_WALK)
  } catch (e) {}
  try {fs.mkdirSync(BAD_START_WALK, 0o200)} catch (e) {}
})

afterAll(() => {
  try {fs.rmdirSync(BAD_START_WALK)} catch (e) {}
})


function includes (list: string[], item: string) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    if (list[i] === item)
      return true
  }
  return false
}

describe('Walker', () => {
  test('simple walk', (done) => {
    var n = 9

    new Walker(SIMPLE_WALK)
      .on('dir', function (dir) {
        includes([SIMPLE_WALK, SIMPLE_WALK + '/d'], dir)
        n--
      })
      .on('file', function (file) {
        includes(
          [SIMPLE_WALK + '/a',
          SIMPLE_WALK + '/b',
          SIMPLE_WALK + '/c',
          SIMPLE_WALK + '/d/e',
          SIMPLE_WALK + '/d/f',
          SIMPLE_WALK + '/d/g'],
          file)
        n--
      })
      .on('error', function (er) {
        expect(er).toBeUndefined()
      })
      .on('end', function () {
        n--
        expect(n).toEqual(0)
        done()
      })
  })
  test('simpleWalkExcludingSubDirTree', (done) => {
    var n = 5

    new Walker(SIMPLE_WALK)
      .filterDir(function (dir) {
        return dir != (SIMPLE_WALK + '/d')
      })
      .on('dir', function (dir) {
        expect(dir).toEqual(SIMPLE_WALK)
        n--
      })
      .on('file', function (file) {
        includes(
          [SIMPLE_WALK + '/a',
          SIMPLE_WALK + '/b',
          SIMPLE_WALK + '/c'],
          file)
        n--
      })
      .on('error', function (er, entry, stat) {
        expect(er).toBeUndefined()
      })
      .on('end', function () {
        n--
        expect(n).toEqual(0)
        done()
      })
  })

  test('errorWalk', (done) => {
    var n = 6

    new Walker(ERROR_WALK)
      .on('dir', function (dir) {
        expect(dir).toEqual(ERROR_WALK)
        n--
      })
      .on('file', function (file) {
        includes(
          [ERROR_WALK + '/a',
          ERROR_WALK + '/b',
          ERROR_WALK + '/c'],
          file)
        n--
      })
      .on('error', function (er, entry, stat) {
        expect(entry).toEqual(ERROR_WALK + '/d')
        n--
      })
      .on('end', function () {
        n--
        expect(n).toEqual(0)
        done()
      })
  })

  test('badStart', (done) => {
    var n = 2

    new Walker(BAD_START_WALK)
      .on('dir', function (dir) {
        n--
      })
      .on('file', function (file) {
        n--
      })
      .on('error', function (er, entry, stat) {
        expect(entry).toEqual(BAD_START_WALK)
        n--
      })
      .on('end', function () {
        n--
        expect(n).toEqual(0)
        done()
      })
  })

  test('symlinkTest', (done) => {
    var n = 10

    new Walker(SYMLINK_WALK)
      .on('dir', function (dir) {
        includes([SYMLINK_WALK, SYMLINK_WALK + '/d'],
          dir)
        n--
      })
      .on('file', function (file) {
        includes(
          [
            SYMLINK_WALK + '/a',
            SYMLINK_WALK + '/b',
            SYMLINK_WALK + '/d/e',
            SYMLINK_WALK + '/d/f',
            SYMLINK_WALK + '/d/g',
          ],
          file
        )
        n--
      })
      .on('symlink', function (symlink) {
        includes(
          [
            SYMLINK_WALK + '/c',
            SYMLINK_WALK + '/e',
          ],
          symlink
        )
        n--
      })
      .on('error', function (er) {
        expect(er).toBeUndefined()
      })
      .on('end', function () {
        n--
        expect(n).toEqual(0)
        done()
      })
  })
})
