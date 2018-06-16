FROM golang:1.10 as build
WORKDIR /go/src/github.com/tivvit/yam/
RUN go get -u github.com/golang/dep/cmd/dep
COPY . .
RUN dep ensure
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

FROM alpine
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=build /go/src/github.com/tivvit/yam/app .
CMD ["./app"]