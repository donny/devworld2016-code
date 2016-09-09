func main(args: [String:Any]) -> [String:Any] {
  if let payload = args["payload"] as? [Any] {
    let strings = payload.map { String($0).uppercaseString }
    return ["payload": strings]
  } else if let payload = args["payload"] as? String {
    let strings = payload.uppercaseString.componentsSeparatedByString(" ")
    return ["payload": strings]
  } else {
    return ["payload": [String]()]
  }
}
