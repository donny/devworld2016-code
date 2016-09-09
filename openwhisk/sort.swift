func main(args: [String:Any]) -> [String:Any] {
  if let payload = args["payload"] as? [Any] {
    let strings = payload.map { String($0) }
    return ["payload": strings.sort { $0 < $1 }]
  } else if let payload = args["payload"] as? String {
    let strings = payload.componentsSeparatedByString(" ")
    return ["payload": strings.sort { $0 < $1 }]
  } else {
    return ["payload": [String]()]
  }
}
