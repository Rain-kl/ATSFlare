package common

import (
	"embed"
	"github.com/gin-contrib/static"
	"io/fs"
	"net/http"
	"strings"
)

// Credit: https://github.com/gin-contrib/static/issues/19

type embedFileSystem struct {
	http.FileSystem
}

func (e embedFileSystem) Exists(prefix string, path string) bool {
	cleanPath := strings.TrimPrefix(path, prefix)
	cleanPath = strings.TrimPrefix(cleanPath, "/")
	if cleanPath == "" {
		return false
	}

	_, err := e.Open(cleanPath)
	if err != nil {
		return false
	}
	return true
}

func EmbedFolder(fsEmbed embed.FS, targetPath string) static.ServeFileSystem {
	efs, err := fs.Sub(fsEmbed, targetPath)
	if err != nil {
		panic(err)
	}
	return embedFileSystem{
		FileSystem: http.FS(efs),
	}
}
