from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dateutil import parser
import secrets
from datetime import datetime, timedelta
import pytz
import random
import string
import re
import logging
import requests
from sqlalchemy.pool import StaticPool

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db?timeout=30&check_same_thread=False'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'poolclass': StaticPool
}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db = SQLAlchemy(app)

with app.app_context():
    db.create_all()
    with db.engine.connect() as conn:
        conn.exec_driver_sql('PRAGMA journal_mode=WAL;')
        logger.info("WAL mode enabled for SQLite database")

CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": ["https://admin.777.ua", "https://admin.betking.ua", "https://app.powerbi.com", "https://admin.funrize.com", "https://admin.nolimitcoins.com" , "https://admin.taofortune.com", "https://admin.funzcity.com", "https://admin.fortunewheelz.com", "https://admin.vegas.ua", "https://admin.wildwinz.com", "https://admin.betking.com.ua", "https://admin.jackpotrabbit.com", "https://admin.sweepshark.com", "https://admin.scarletsands.com"], 
        "methods": ["GET", "POST", "DELETE", "OPTIONS", "PUT"],
        "allow_headers": ["Authorization", "Content-Type"], 
        "supports_credentials": True
    }
})

app.secret_key = 'betking'

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    manager_name = db.Column(db.String(128), nullable=False) 
    status = db.Column(db.String(20), nullable=False) 
    password_hash = db.Column(db.String(128), nullable=False)
    token = db.Column(db.String(128), unique=True, nullable=True)
    active_url = db.Column(db.Text, default=False)
    performance_goal = db.Column(db.Integer, nullable=False, default=80)
    work_hours = db.Column(db.Integer, nullable=False, default=7)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Working(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(10), nullable=False)
    url = db.Column(db.String(255), nullable=False)
    project = db.Column(db.String(100), nullable=False)
    playerID = db.Column(db.String(50), nullable=False)
    manager_name = db.Column(db.String(80), nullable=False)
    comment = db.Column(db.Text, nullable=True)
    autopayment = db.Column(db.Boolean, default=False, nullable=True) 
    tl_comment = db.Column(db.Text, nullable=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('date', 'playerID', 'manager_name', name='unique_date_player_manager'),
    )

class AutoPayments(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(10), nullable=False)
    url = db.Column(db.String(255), nullable=False)
    project = db.Column(db.String(100), nullable=False)
    playerID = db.Column(db.String(50), nullable=False)
    manager_name = db.Column(db.String(80), nullable=False)
    comment = db.Column(db.Text, nullable=True)
    autopayment = db.Column(db.Boolean, default=False, nullable=True) 

    __table_args__ = (
        db.UniqueConstraint('date', 'playerID', 'manager_name', name='unique_date_player_manager'),
    )

class Fraud(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date_added = db.Column(db.DateTime, default=datetime.utcnow)
    project = db.Column(db.String(50), nullable=False)
    player_id = db.Column(db.String(80), nullable=False)
    url = db.Column(db.String(255), nullable=False)
    manager = db.Column(db.String(128), nullable=False)
    comment = db.Column(db.String(255), nullable=True)

class PowerBI(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    manager_initials = db.Column(db.String(50), nullable=False)
    date_recorded = db.Column(db.DateTime, default=datetime.utcnow)
    player_id = db.Column(db.String(80), nullable=False)
    sheet_name = db.Column(db.String(255), nullable=False)

class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    date_added = db.Column(db.DateTime, default=datetime.utcnow)

class Settings(db.Model):
    __tablename__ = 'settings'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    parametr = db.Column(db.JSON, nullable=False)

    def __init__(self, name, parametr):
        self.name = name
        self.parametr = parametr

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'parametr': self.parametr}

class Seen(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.String(80), nullable=False)
    url = db.Column(db.String(255), nullable=False)
    date = db.Column(db.DateTime, nullable=False) 
    manager_name = db.Column(db.String(80), nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('date', 'url', 'manager_name', name='unique_seen_entry'),
    )

ALERT_CONFIG = {
    'Pendings': {
        'fields': {
            'priorities': {'type': 'list', 'required': True},
            'amount': {'type': 'int', 'required': True},
            'manager': {'type': 'str', 'required': True}
        },
        'requires_project': True
    },
    'PayOut': {
        'fields': {
            'priorities': {'type': 'list', 'required': True},
            'amount': {'type': 'int', 'required': True},
            'auto_disable': {'type': 'bool', 'default': False},
            'manager': {'type': 'str', 'required': True}
        },
        'requires_project': True
    },
    'Deposits': {
        'fields': {
            'settings': {'type': 'list', 'required': True, 'validate': lambda x: all(isinstance(s, dict) and 'amount' in s and 'bonusAmount' in s for s in x)},
            'inefficient_transaction_percent': {'type': 'float', 'required': True, 'parse': lambda x: float(x.strip('%')) / 100},
            'manager': {'type': 'str', 'required': True}
        },
        'requires_project': True
    },
    'Verification': {
        'fields': {
            'sheets': {
                'type': 'dict',
                'required': True,
                'validate': lambda x: isinstance(x, dict) and all(k in ['Betking', '777', 'Vegas'] for k in x) and all(isinstance(v, str) and v for v in x.values())
            }
        },
        'requires_project': False
    }
}

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    manager_name = data.get('managerName')
    status = data.get('status')
    
    if User.query.filter_by(username=username).first() is not None:
        return jsonify({"success": False, "message": "User already exists"}), 400

    new_user = User(username=username, manager_name=manager_name, status=status)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"success": True}), 201

@app.route('/api/auth', methods=['POST'])
def auth():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        if not user.token:
            user.token = secrets.token_hex(16)
            db.session.commit()
        return jsonify({"success": True, "token": user.token}), 200
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401
    
@app.route('/api/check_token', methods=['POST'])
def check_token():
    data = request.json
    token = data.get('token')

    if not token:
        return jsonify({"success": False, "message": "Token is missing"}), 400

    user = User.query.filter_by(token=token).first()
    if user:
        return jsonify({
            "success": True, 
            "id": user.id, 
            "name": user.manager_name,
            "status": user.status,
            "goal": user.performance_goal,
            "work_hours": user.work_hours
        }), 200
    else:
        return jsonify({"success": False, "message": "Invalid token"}), 401
    
@app.route('/api/change_password_by_user', methods=['POST'])
def change_password_by_user():
    data = request.get_json()
    new_password = data.get('password')

    if not new_password:
        return jsonify({'error': 'Пароль не може бути порожнім'}), 400

    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Токен не надано'}), 401

    token = token.split("Bearer ")[-1] 

    user = User.query.filter_by(token=token).first()
    if not user:
        return jsonify({'error': 'Користувача не знайдено або токен неправильний'}), 404

    try:
        user.set_password(new_password)
        db.session.commit()
        return jsonify({'message': 'Пароль успішно змінено'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/update_active_page', methods=['POST'])
def update_active_page():
    data = request.json
    token = request.headers.get('Authorization').split(' ')[1]
    url = data.get('url')

    user = User.query.filter_by(token=token).first()
    if user:
        user.active_url = url
        db.session.commit()
        return jsonify({"success": True}), 200
    else:
        return jsonify({"success": False, "message": "User not found"}), 404
    
@app.route('/api/seen', methods=['POST'])
def add_seen_entry():
    data = request.json
    date_str = data.get('date') 
    url = data.get('url')
    project = data.get('project')
    user_id = data.get('user_id')
    token = request.headers.get('Authorization').replace('Bearer ', '')

    try:
        date_obj = datetime.strptime(date_str, '%d.%m.%Y %H:%M')
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format. Use dd.mm.yyyy hh:mm."}), 400

    manager_name = decode_token(token)

    existing_entry = Seen.query.filter_by(url=url, manager_name=manager_name).first()
    if existing_entry:
        return jsonify({"success": True, "message": "Entry already exists."}), 200
    
    new_entry = Seen(date=date_obj, url=url, user_id=user_id, project=project, manager_name=manager_name)
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"success": True, "message": "New seen entry created."}), 200

@app.route('/api/working', methods=['POST'])
def add_working_entry():
    data = request.json
    date = data.get('date') 
    url = data.get('url')
    project = data.get('project')
    playerID = data.get('playerID')
    token = request.headers.get('Authorization').replace('Bearer ', '')
    comment = data.get('comment')
    autopayment = data.get('autopayment')

    try:
        date_obj = datetime.strptime(date, '%d.%m.%Y')
        formatted_date = date_obj.strftime('%Y-%m-%d')
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format. Use dd.mm.yyyy."}), 400

    manager_name = decode_token(token)

    system_entry = Working.query.filter_by(playerID=playerID, manager_name="System").first()
    
    if system_entry:
        system_entry.date = formatted_date  
        system_entry.manager_name = manager_name
        system_entry.comment = comment
        db.session.commit()
        return jsonify({"success": True, "message": "System entry updated."}), 200
    else:
        existing_entry = Working.query.filter_by(date=formatted_date, playerID=playerID, manager_name=manager_name).first()
        if existing_entry:
            existing_entry.comment = comment
            if autopayment == 1:
                existing_entry.autopayment = autopayment
            db.session.commit()
            return jsonify({"success": True, "message": "Comment updated."}), 200
        else:
            new_entry = Working(date=formatted_date, url=url, project=project, playerID=playerID, manager_name=manager_name, comment=comment, autopayment=autopayment)
            db.session.add(new_entry)
            db.session.commit()
            return jsonify({"success": True, "message": "New entry created."}), 200

@app.route('/api/working/<int:entry_id>/tl_comment', methods=['PUT'])
def update_tl_comment(entry_id):
    token = request.headers.get('Authorization').replace('Bearer ', '')
    user = User.query.filter_by(token=token).first()

    if not user or user.status != 'Admin':
        return jsonify({"error": "Unauthorized, admin access required."}), 403

    data = request.json
    tl_comment = data.get('tl_comment')

    if tl_comment is None:
        return jsonify({"error": "Missing tl_comment field."}), 400

    entry = Working.query.get(entry_id)
    if not entry:
        return jsonify({"error": "Entry not found."}), 404

    entry.tl_comment = tl_comment
    db.session.commit()

    return jsonify({"success": True, "message": "TL comment updated successfully."}), 200

@app.route('/api/autopayment', methods=['POST'])
def add_autopayment_entry():
    data = request.json
    date = data.get('date')
    url = data.get('url')
    project = data.get('project')
    playerID = data.get('playerID')
    token = request.headers.get('Authorization').replace('Bearer ', '')
    comment = data.get('comment')
    autopayment = data.get('autopayment')
    manager_name = decode_token(token)

    try:
        date_obj = datetime.strptime(date, '%d.%m.%Y')
        formatted_date = date_obj.strftime('%Y-%m-%d')
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format. Use dd.mm.yyyy."}), 400

    existing_entry = Working.query.filter_by(date=formatted_date, playerID=playerID, manager_name=manager_name).first()
    newPayment = AutoPayments(date=formatted_date, url=url, project=project, playerID=playerID, manager_name=manager_name, comment=comment, autopayment=autopayment)

    if existing_entry:
        existing_entry.autopayment = autopayment
        db.session.commit()
        return jsonify({"success": True, "message": "Autopayment updated."}), 200
    else:
        new_entry = Working(date=formatted_date, url=url, project=project, playerID=playerID, manager_name=manager_name, comment=comment, autopayment=autopayment)
        db.session.add(new_entry)
        db.session.add(newPayment)
        db.session.commit()
        return jsonify({"success": True, "message": "New entry to autopayment created."}), 200

@app.route('/api/users', methods=['GET'])
def get_users():
    token = request.headers.get('Authorization').replace('Bearer ', '')
    user = User.query.filter_by(token=token).first()

    if user and user.status == 'Admin':
        users = User.query.all()
        return jsonify([{
            'id': u.id,
            'manager_name': u.manager_name,  
            'status': u.status,
            'active_url': u.active_url,
            'username': u.username,
            'performance_goal': u.performance_goal,
            'work_hours': u.work_hours
        } for u in users]), 200
    return jsonify({"error": "Unauthorized"}), 403

@app.route('/api/delete_user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    token = request.headers.get('Authorization').replace('Bearer ', '')
    user = User.query.filter_by(token=token).first()

    if user and user.status == 'Admin':
        user_to_delete = User.query.get(user_id)
        if user_to_delete:
            db.session.delete(user_to_delete)
            db.session.commit()
            return jsonify({"success": True, "message": "User deleted successfully."}), 200
        else:
            return jsonify({"success": False, "message": "User not found."}), 404
    return jsonify({"error": "Unauthorized"}), 403

@app.route('/api/change_password/<int:user_id>', methods=['PUT'])
def change_password(user_id):
    token = request.headers.get('Authorization').replace('Bearer ', '')
    user = User.query.filter_by(token=token).first()

    if user and user.status == 'Admin':
        user_to_change = User.query.get(user_id)
        if user_to_change:
            new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
            user_to_change.set_password(new_password)
            db.session.commit()
            return jsonify({"success": True, "new_password": new_password}), 200
        else:
            return jsonify({"success": False, "message": "User not found."}), 404
    return jsonify({"error": "Unauthorized"}), 403

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    token = request.headers.get('Authorization').replace('Bearer ', '')
    user = User.query.filter_by(token=token).first()

    if not user or user.status != 'Admin':
        return jsonify({"error": "Unauthorized"}), 403

    user_to_update = User.query.get(user_id)
    if not user_to_update:
        return jsonify({"success": False, "message": "User not found."}), 404

    data = request.json
    manager_name = data.get('manager_name')
    username = data.get('username')
    status = data.get('status')
    performance_goal = data.get('performance_goal')
    work_hours = data.get('work_hours')


    if not manager_name or not username or not status:
        return jsonify({"success": False, "message": "Missing required fields."}), 400

    if status not in ['Manager', 'Admin']:
        return jsonify({"success": False, "message": "Invalid status."}), 400

    existing_user = User.query.filter_by(username=username).filter(User.id != user_id).first()
    if existing_user:
        return jsonify({"success": False, "message": "Username already exists."}), 400

    user_to_update.manager_name = manager_name
    user_to_update.username = username
    user_to_update.status = status
    user_to_update.performance_goal = performance_goal
    user_to_update.work_hours = work_hours

    db.session.commit()

    return jsonify({"success": True, "message": "User updated successfully."}), 200

@app.route('/api/unread_tl_comments/<int:user_id>', methods=['GET'])
def get_unread_tl_comments(user_id):
    token = request.headers.get('Authorization').replace('Bearer ', '')
    current_user = User.query.filter_by(token=token).first()

    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    if current_user.id != user_id and current_user.status != 'Admin':
        return jsonify({"error": "Access denied"}), 403

    try:
        unread_comments = Working.query.filter_by(manager_name=current_user.manager_name) \
            .filter(Working.tl_comment != None, Working.tl_comment != '', Working.is_read == False) \
            .order_by(Working.id.asc()) \
            .all()

        comments_data = [{
            'entry_id': entry.id,
            'player_id': entry.playerID,
            'project': entry.project,
            'tl_comment': entry.tl_comment,
            'date': entry.date
        } for entry in unread_comments]

        return jsonify({
            "success": True,
            "count": len(unread_comments),
            "comments": comments_data
        }), 200

    except Exception as e:
        logger.error(f"Error fetching unread comments for user_id={user_id}: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/api/working/<int:entry_id>/mark_read', methods=['PUT'])
def mark_comment_read(entry_id):
    token = request.headers.get('Authorization').replace('Bearer ', '')
    current_user = User.query.filter_by(token=token).first()

    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    entry = Working.query.get(entry_id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    if entry.manager_name != current_user.manager_name and current_user.status != 'Admin':
        return jsonify({"error": "Access denied"}), 403

    entry.is_read = True
    db.session.commit()

    return jsonify({"success": True, "message": "Comment marked as read"}), 200

@app.route('/api/user/active_url/<int:user_id>', methods=['GET'])
def get_user_active_url(user_id):
    token = request.headers.get('Authorization').replace('Bearer ', '')
    user = User.query.filter_by(token=token).first()

    if not user or user.status != 'Admin':
        return jsonify({"error": "Unauthorized"}), 403

    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({"success": False, "message": "User not found."}), 404

    if not target_user.active_url:
        return jsonify({"success": False, "message": "No active URL found for this user."}), 404

    return jsonify({"success": True, "active_url": target_user.active_url}), 200

@app.route('/api/get_seen_entries/<int:user_id>', methods=['GET', 'OPTIONS'])
def get_seen_entries(user_id):
    if request.method == 'OPTIONS':
        return '', 200  

    token = request.headers.get('Authorization').replace('Bearer ', '')
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return jsonify({"error": "Unauthorized"}), 403

    date_from_request = request.args.get('date')
    try:
        date_obj = datetime.strptime(date_from_request, '%Y-%m-%d')
        date_filter = date_obj.date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    try:
        seen_entries = Seen.query.filter_by(manager_name=user.manager_name)
        if date_filter:
            seen_entries = seen_entries.filter(db.func.date(Seen.date) == date_filter)
        seen_entries = seen_entries.order_by(Seen.date.desc()).all()

        entries_data = [{
            'player_id': entry.user_id,
            'url': entry.url,
            'date': entry.date.strftime('%d.%m.%Y %H:%M'),
            'project': entry.project
        } for entry in seen_entries]

        return jsonify({
            "seen_entries": entries_data,
            "total_seen": len(entries_data)
        }), 200

    except Exception as e:
        logger.error(f"Error fetching seen entries for user_id={user_id}, manager_name={user.manager_name}: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/api/get_statistics/<int:user_id>', methods=['GET', 'OPTIONS'])
def get_statistics(user_id):
    if request.method == 'OPTIONS':
        return '', 200  

    token = request.headers.get('Authorization').replace('Bearer ', '')
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return jsonify({"error": "Unauthorized"}), 403

    date_from_request = request.args.get('date')
    try:
        date_obj = datetime.strptime(date_from_request, '%Y-%m-%d')
        date_filter = date_obj.date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    try:
        working_entries = Working.query.filter_by(manager_name=user.manager_name)
        if date_filter:
            working_entries = working_entries.filter(Working.date == date_filter)
        working_entries = working_entries.order_by(Working.id.desc()).all()

        total_entries = len(working_entries)
        betking_entries = sum(1 for entry in working_entries if entry.project == 'betking')
        project_777_entries = sum(1 for entry in working_entries if entry.project == '777')
        project_vegas_entries = sum(1 for entry in working_entries if entry.project == 'vegas')

        seen_entries = Seen.query.filter_by(manager_name=user.manager_name)
        if date_filter:
            seen_entries = seen_entries.filter(db.func.date(Seen.date) == date_filter)
        seen_entries = seen_entries.all()
        seen_today = len(seen_entries)

        entries_data = [{
            'id': entry.id,  
            'player_id': entry.playerID,
            'project': entry.project,
            'comment': entry.comment,
            'tl_comment': entry.tl_comment,  
            'url': entry.url,
            'autopayment': entry.autopayment,
            'created_at': entry.created_at.isoformat() + 'Z' if entry.created_at else None

        } for entry in working_entries]

        return jsonify({
            "total_players": total_entries,
            "betking_count": betking_entries,
            "seven_count": project_777_entries,
            "vegas_count": project_vegas_entries,
            "seen_today": seen_today,
            "entries": entries_data
        }), 200

    except Exception as e:
        logger.error(f"Error fetching statistics for user_id={user_id}, manager_name={user.manager_name}: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/api/get_statistics_for_period', methods=['GET'])
def get_statistics_for_period():
    start_utc_str = request.args.get('start_utc')
    end_utc_str = request.args.get('end_utc')
    user_id = request.args.get('user_id')

    if not all([start_utc_str, end_utc_str, user_id]):
        return jsonify({"error": "Missing required parameters"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        start_dt = parser.isoparse(start_utc_str)
        end_dt = parser.isoparse(end_utc_str)
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    working_entries = Working.query.filter(
        Working.manager_name == user.manager_name,
        Working.created_at.between(start_dt, end_dt)
    ).order_by(Working.id.desc()).all()

    entries_data = [{
        'id': entry.id,
        'player_id': entry.playerID,
        'project': entry.project,
        'created_at': entry.created_at.isoformat() + 'Z' if entry.created_at else None
    } for entry in working_entries]

    return jsonify({
        "total_players": len(working_entries),
        "entries": entries_data
    }), 200


@app.route('/api/get_all_statistics', methods=['GET', 'OPTIONS'])
def get_all_statistics():
    if request.method == 'OPTIONS':
        return '', 200  

    token = request.headers.get('Authorization').replace('Bearer ', '')
    user = User.query.filter_by(token=token).first()

    if not user or user.status != 'Admin':
        return jsonify({"error": "Unauthorized"}), 403

    date_from_request = request.args.get('date')
    try:
        date_obj = datetime.strptime(date_from_request, '%Y-%m-%d')
        date_filter = date_obj.date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    try:
        users = User.query.all()
        result = []
        for user in users:
            working_entries = Working.query.filter_by(manager_name=user.manager_name)
            if date_filter:
                working_entries = working_entries.filter(Working.date == date_filter)
            working_entries = working_entries.order_by(Working.id.desc()).all()

            total_entries = len(working_entries)
            betking_entries = sum(1 for entry in working_entries if entry.project == 'betking')
            project_777_entries = sum(1 for entry in working_entries if entry.project == '777')
            project_vegas_entries = sum(1 for entry in working_entries if entry.project == 'vegas')

            seen_entries = Seen.query.filter_by(manager_name=user.manager_name)
            if date_filter:
                seen_entries = seen_entries.filter(db.func.date(Seen.date) == date_filter)  # Фильтр по дате без времени
            seen_entries = seen_entries.all()
            seen_today = len(seen_entries)

            result.append({
                'id': user.id,
                'manager_name': user.manager_name,
                'total_players': total_entries,
                'betking_count': betking_entries,
                'seven_count': project_777_entries,
                'vegas_count': project_vegas_entries,
                'seen_today': seen_today
            })

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error fetching all statistics: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/api/frauds', methods=['GET'])
def get_frauds():
    frauds = Fraud.query.all()
    fraud_list = [{
        'id': fraud.id,
        'date_added': fraud.date_added,
        'project': fraud.project,
        'player_id': fraud.player_id,
        'url': fraud.url,
        'manager': fraud.manager,
        'comment': fraud.comment
    } for fraud in frauds]
    return jsonify(fraud_list)

@app.route('/api/add_fraud', methods=['POST'])
def add_fraud():
    data = request.json
    player_id = data.get('player_id')
    url = data.get('url')
    comment = data.get('comment')
    token = request.headers.get('Authorization').replace('Bearer ', '')
    manager = decode_token(token)

    match = re.search(r'https://admin\.([a-zA-Z0-9-]+)\.', url)
    
    if match:
        project = match.group(1)
    else:
        project = "unknown"

    new_fraud = Fraud(player_id=player_id, url=url, manager=manager, project=project, comment=comment)
    db.session.add(new_fraud)
    db.session.commit()

    return jsonify({"success": True}), 201

@app.route('/api/delete_fraud/<int:id>', methods=['DELETE'])
def delete_fraud(id):
    fraud = Fraud.query.get(id)
    if not fraud:
        return jsonify({"success": False, "message": "Fraud not found"}), 404

    db.session.delete(fraud)
    db.session.commit()

    return jsonify({"success": True}), 200

@app.route('/api/edit_fraud/<int:id>', methods=['PUT'])
def edit_fraud(id):
    data = request.json
    new_comment = data.get('comment')

    fraud = Fraud.query.get(id)
    if not fraud:
        return jsonify({"success": False, "message": "Fraud not found"}), 404

    fraud.comment = new_comment
    db.session.commit()

    return jsonify({"success": True, "message": "Comment updated successfully"}), 200

@app.route('/api/statistics', methods=['GET'])
def get_department_statistics():
    token = request.headers.get('Authorization').replace('Bearer ', '')

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')

    start_date_filter = start_date_obj.strftime('%Y-%m-%d')
    end_date_filter = end_date_obj.strftime('%Y-%m-%d')

    total_for_period = Working.query.filter(Working.date.between(start_date_filter, end_date_filter)).count()
    total_all_time = Working.query.count()

    managers = User.query.filter_by(status='Manager').all()

    managers_data = []
    total_processed_per_manager = 0
    total_average_processed_per_manager = 0
    num_managers = len(managers)

    is_one_day = start_date_obj == end_date_obj

    for manager in managers:
        processed_for_period = Working.query.filter_by(manager_name=manager.manager_name)\
            .filter(Working.date.between(start_date_filter, end_date_filter)).count()
        processed_all_time = Working.query.filter_by(manager_name=manager.manager_name).count()

        total_processed_per_manager += processed_for_period

        if is_one_day:
            unique_days_all_time = db.session.query(Working.date)\
                .filter_by(manager_name=manager.manager_name)\
                .distinct().count()

            average_processed_per_period = processed_all_time / unique_days_all_time if unique_days_all_time > 0 else 0
        else:
            unique_days_selected_period = db.session.query(Working.date)\
                .filter_by(manager_name=manager.manager_name)\
                .filter(Working.date.between(start_date_filter, end_date_filter))\
                .distinct().count()

            average_processed_per_period = processed_for_period / unique_days_selected_period if unique_days_selected_period > 0 else 0

        managers_data.append({
            'name': manager.manager_name,
            'processedForPeriod': processed_for_period,
            'processedAllTime': processed_all_time,
            'averageProcessedPerPeriod': average_processed_per_period
        })

        total_average_processed_per_manager += average_processed_per_period

    average_processed_per_manager = total_average_processed_per_manager / num_managers if num_managers > 0 else 0

    managers_data.sort(key=lambda x: x['processedForPeriod'], reverse=True)

    return jsonify({
        'totalForPeriod': total_for_period,
        'totalAllTime': total_all_time,
        'averageProcessedPerManager': average_processed_per_manager, 
        'managers': managers_data
    }), 200

@app.route('/api/check_user_in_fraud', methods=['POST'])
def check_user_in_fraud():
    data = request.get_json()
    player_id = data.get('player_id')
    url = data.get('url')

    if not player_id:
        return jsonify({'error': 'Недостатньо даних для перевірки'}), 400

    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Токен не надано'}), 401

    token = token.split("Bearer ")[-1]

    user = User.query.filter_by(token=token).first()
    if not user:
        return jsonify({'error': 'Користувача не знайдено або токен неправильний'}), 404

    fraud_entry = Fraud.query.filter_by(player_id=player_id).first()

    if fraud_entry:
        return jsonify({
            'fraudExists': True,
            'manager_name': fraud_entry.manager,
            'comment': fraud_entry.comment,
            'fraud_id': fraud_entry.id,
            'date': fraud_entry.date_added
        }), 200
    else:
        return jsonify({'fraudExists': False}), 200
    
@app.route('/get_articles', methods=['GET'])
def get_articles():
    articles = Article.query.order_by(Article.date_added.desc()).all()
    return jsonify([{'id': article.id, 'title': article.title, 'content': article.content} for article in articles])

@app.route('/get_article/<int:article_id>', methods=['GET'])
def get_article(article_id):
    article = Article.query.get(article_id)
    if article:
        return jsonify({'id': article.id, 'title': article.title, 'content': article.content})
    return jsonify({'error': 'Article not found'}), 404

@app.route('/save_article', methods=['POST'])
def save_article():
    data = request.json
    new_article = Article(
        title=data.get('title'),
        content=data.get('content')
    )
    db.session.add(new_article)
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/update_article/<int:article_id>', methods=['POST'])
def update_article(article_id):
    data = request.json
    article = Article.query.get(article_id)
    if article:
        article.title = data.get('title')
        article.content = data.get('content')
        db.session.commit()
        return jsonify({'status': 'success'})
    return jsonify({'error': 'Article not found'}), 404

@app.route('/delete_article/<int:article_id>', methods=['DELETE'])
def delete_article(article_id):
    article = Article.query.get(article_id)
    if article:
        db.session.delete(article)
        db.session.commit()
        return jsonify({'status': 'success'})
    return jsonify({'error': 'Article not found'}), 404

@app.route('/api/check_user_in_checklsit', methods=['POST'])
def check_user_in_checklsit():
    data = request.get_json()
    player_id = data.get('player_id')
    url = data.get('url')

    if not player_id:
        return jsonify({'error': 'Недостатньо даних для перевірки'}), 400

    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Токен не надано'}), 401

    token = token.split("Bearer ")[-1]

    user = User.query.filter_by(token=token).first()
    if not user:
        return jsonify({'error': 'Користувача не знайдено або токен неправильний'}), 404

    checklist_entries = Working.query.filter(
        Working.playerID == player_id,
        Working.comment.ilike('%Переглянутий%')
    ).order_by(Working.date).all()
    if checklist_entries:
        checklist_entry = max(checklist_entries, key=lambda entry: entry.id)
        time_match = re.search(r'Переглянутий в (\d{2}:\d{2})', checklist_entry.comment)
        time = time_match.group(1) if time_match else 'Немає часу'

        return jsonify({
            'checklistExists': True,
            'manager_name': checklist_entry.manager_name,
            'date': checklist_entry.date,
            'checklist_id': checklist_entry.id,
            'time': time 
        }), 200
    else:
        return jsonify({'checklistExists': False}), 200

@app.route('/api/powerbi/delete', methods=['DELETE'])
def delete_powerbi_record():
    data = request.json
    player_id = data.get('player_id')
    sheet_name = data.get('sheet_name')

    records = PowerBI.query.filter_by(player_id=player_id, sheet_name=sheet_name).all()
    if records:
        for record in records:
            db.session.delete(record)
        db.session.commit()
        return jsonify({"success": True}), 200
    else:
        return jsonify({"error": "Записи не найдены"}), 404

@app.route('/api/powerbi/add', methods=['POST'])
def add_powerbi_record():
    data = request.json
    token = request.headers.get('Authorization')
    token = token.split("Bearer ")[-1]    
    print(token)
    manager = decode_token(token)
    player_id = data.get('player_id')
    sheet_name = data.get('sheet_name')

    new_record = PowerBI(
        manager_initials=manager,
        player_id=player_id,
        sheet_name=sheet_name
    )
    db.session.add(new_record)
    db.session.commit()

    return jsonify({"success": True}), 201

@app.route('/api/powerbi/get', methods=['GET'])
def get_powerbi_records():
    sheet_name = request.args.get('sheet_name')
    records = PowerBI.query.filter_by(sheet_name=sheet_name).all()

    return jsonify([{
        'manager_initials': record.manager_initials,
        'player_id': record.player_id,
        'sheet_name': record.sheet_name,
        'date': record.date_recorded.strftime('%Y-%m-%d')  
    } for record in records])

@app.route('/api/get_active_users', methods=['GET'])
def get_active_users():
    users = User.query.filter(User.active_url.isnot(None)).all()
    user_data = [{"id": user.id, "username": user.username, "manager_name": user.manager_name, "active_url": user.active_url} for user in users]
    return jsonify(user_data)

@app.route("/api/version", methods=["GET"])
def get_script_version():
    latest_version = fetch_latest_version()
    if latest_version:
        return jsonify({"version": latest_version})
    else:
        return jsonify({"error": "Не удалось получить версию"}), 500

def get_setting(name):
    return Settings.query.filter_by(name=name).first()

def upsert_setting(name, value):
    setting = get_setting(name)
    if setting:
        setting.parametr = value
    else:
        setting = Settings(name=name, parametr=value)
        db.session.add(setting)
    return setting

def deserialize_field(value, field_type, default=None):
    if value is None:
        return default
    if field_type == 'list':
        return value if isinstance(value, list) else default
    elif field_type == 'dict':
        return value if isinstance(value, dict) else default
    elif field_type == 'int':
        return int(value) if isinstance(value, (str, int)) else default
    elif field_type == 'float':
        return float(value) if isinstance(value, (str, float)) else default
    elif field_type == 'bool':
        return bool(value) if isinstance(value, (str, bool)) else default
    return value

@app.route('/get_settings', methods=['GET'])
def get_settings():
    alert_type = request.args.get('alert_type')
    project = request.args.get('project')

    if not alert_type or alert_type not in ALERT_CONFIG:
        return jsonify({'error': 'Invalid or missing alert_type'}), 400

    config = ALERT_CONFIG[alert_type]
    if config['requires_project'] and not project:
        return jsonify({'error': 'Project is required for this alert type'}), 400

    try:
        settings_key = f"{alert_type}_{project}" if config['requires_project'] else alert_type
        setting = get_setting(settings_key)
        
        result = {}
        if setting:
            stored_data = setting.parametr
            for field, spec in config['fields'].items():
                result[field] = deserialize_field(stored_data.get(field), spec['type'], spec.get('default'))
        else:
            for field, spec in config['fields'].items():
                result[field] = spec.get('default', None if spec['type'] not in ['list', 'dict'] else {} if spec['type'] == 'dict' else [])

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error in get_settings: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/update_settings', methods=['POST'])
def update_settings():
    try:
        data = request.get_json()
        alert_type = data.get('alert_type')

        if not alert_type or alert_type not in ALERT_CONFIG:
            return jsonify({'error': 'Invalid or missing alert_type'}), 400

        config = ALERT_CONFIG[alert_type]
        project = data.get('project') if config['requires_project'] else None
        settings_key = f"{alert_type}_{project}" if config['requires_project'] else alert_type
        
        settings_data = {}
        for field, spec in config['fields'].items():
            value = data.get(field)
            
            if spec.get('required') and (value is None or (spec['type'] in ['list', 'dict'] and not value)):
                return jsonify({'error': f"Missing required field: {field}"}), 400
            
            if value is not None:
                if spec['type'] == 'int':
                    try:
                        settings_data[field] = int(value)
                    except ValueError:
                        return jsonify({'error': f"Invalid integer for {field}"}), 400
                elif spec['type'] == 'float' and 'parse' in spec:
                    try:
                        settings_data[field] = spec['parse'](value)
                    except (ValueError, AttributeError):
                        return jsonify({'error': f"Invalid float for {field}"}), 400
                elif spec['type'] == 'bool':
                    settings_data[field] = bool(value)
                elif spec['type'] in ['list', 'dict'] and 'validate' in spec:
                    if not spec['validate'](value):
                        return jsonify({'error': f"Invalid format for {field}"}), 400
                    settings_data[field] = value
                else:
                    settings_data[field] = value

        upsert_setting(settings_key, settings_data)
        db.session.commit()
        
        return jsonify({'success': 'Settings updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in update_settings: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    
@app.route('/api/get_team_performance', methods=['GET'])
def get_team_performance():
    try:
        year = int(request.args.get('year'))
        month = int(request.args.get('month'))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid year or month parameters"}), 400

    start_of_month = datetime(year, month, 1)
    if month == 12:
        end_of_month = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_of_month = datetime(year, month + 1, 1) - timedelta(days=1)

    managers = User.query.filter(User.status.in_(['Manager'])).all()
    manager_names = [m.manager_name for m in managers]
    goals = {m.manager_name: m.performance_goal for m in managers}

    all_workings = Working.query.filter(
        Working.created_at.between(start_of_month, end_of_month + timedelta(days=1))
    ).all()

    results = {name: {} for name in manager_names}

    kyiv_tz = pytz.timezone('Europe/Kyiv')

    for w in all_workings:
        if w.manager_name not in results:
            continue

        created_local = w.created_at.replace(tzinfo=pytz.utc).astimezone(kyiv_tz)
        hour = created_local.hour
        
        shift_date = created_local.date()
        shift_type = ""

        if 9 <= hour < 21:
            shift_type = "day"
        else:
            shift_type = "night"
            if hour < 9:
                shift_date -= timedelta(days=1)
        
        date_str = shift_date.strftime('%Y-%m-%d')

        if date_str not in results[w.manager_name]:
            results[w.manager_name][date_str] = {"day": 0, "night": 0, "total": 0}

        results[w.manager_name][date_str][shift_type] += 1
        results[w.manager_name][date_str]["total"] += 1
        
    return jsonify({
            "performance": results,
            "goals": goals
        })


def decode_token(token):
    user = User.query.filter_by(token=token).first()
    if user:
        return user.manager_name 
    return "Unknown Manager"

def fetch_latest_version():
    url = f"https://github.com/mrudiy/Anti-Fraud-Extension/raw/refs/heads/main/Anti-Fraud%20Extension.user.js"
    try:
        response = requests.get(url)
        response.raise_for_status()
        script_content = response.text

        for line in script_content.splitlines():
            if line.startswith("// @version"):
                latest_version = line.split()[2]
                return latest_version
    except requests.RequestException as e:
        print(f"Ошибка при запросе версии с GitHub: {e}")
    return None

if __name__ == '__main__':
    app.run(debug=True)
