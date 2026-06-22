class BaseController {
  success(res, data, message = 'Success') {
    res.json({ success: true, message, data });
  }

  error(res, message = 'Error', status = 500) {
    res.status(status).json({ success: false, message });
  }
}

export default BaseController;