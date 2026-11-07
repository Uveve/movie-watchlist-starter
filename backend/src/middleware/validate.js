export function validate(parse) {
  return (request, response, next) => {
    request.validatedBody = parse(request.body);
    next();
  };
}
